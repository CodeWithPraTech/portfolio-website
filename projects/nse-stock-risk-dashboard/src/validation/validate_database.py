"""Validate SQLite database contents against source CSV artifacts."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

import pandas as pd

from src.config import (
    CLEAN_PRICES_PATH,
    DATABASE_PATH,
    NIFTY50_CONSTITUENTS_PATH,
    PROJECT_ROOT,
)


REPORT_PATH = PROJECT_ROOT / "reports" / "database_correctness_report.md"
PROFILE_PATH = PROJECT_ROOT / "data" / "processed" / "database_correctness_report.json"
NUMERIC_COLUMNS = ["Open", "High", "Low", "Close", "Adj Close", "Price Adjustment Factor", "Volume"]
DB_NUMERIC_COLUMNS = ["open", "high", "low", "close", "adj_close", "price_adjustment_factor", "volume"]


def main() -> None:
    report = validate_database()
    write_report(report)
    print(json.dumps({
        "status": report["status"],
        "report": str(REPORT_PATH),
        "json": str(PROFILE_PATH),
        "checksPassed": report["checksPassed"],
        "checksFailed": report["checksFailed"],
    }, indent=2))


def validate_database() -> dict:
    clean = pd.read_csv(CLEAN_PRICES_PATH)
    constituents = pd.read_csv(NIFTY50_CONSTITUENTS_PATH)
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        market_prices = pd.read_sql_query(
            """
            SELECT
              symbol AS Symbol,
              trade_date AS Date,
              ticker AS Ticker,
              open AS Open,
              high AS High,
              low AS Low,
              close AS Close,
              adj_close AS "Adj Close",
              price_adjustment_factor AS "Price Adjustment Factor",
              volume AS Volume,
              source AS Source,
              source_url AS "Source URL",
              fetch_timestamp AS "Fetch Timestamp"
            FROM market_prices
            ORDER BY Symbol, Date
            """,
            connection,
        )
        symbols = pd.read_sql_query("SELECT * FROM symbols ORDER BY symbol", connection)
        corporate_actions = pd.read_sql_query("SELECT * FROM corporate_actions", connection)
        quality_issues = pd.read_sql_query("SELECT * FROM quality_issues", connection)
    finally:
        connection.close()

    clean = normalize_prices(clean)
    market_prices = normalize_prices(market_prices)

    checks = []
    add_check(checks, "clean_csv_exists", CLEAN_PRICES_PATH.exists(), str(CLEAN_PRICES_PATH))
    add_check(checks, "constituent_csv_exists", NIFTY50_CONSTITUENTS_PATH.exists(), str(NIFTY50_CONSTITUENTS_PATH))
    add_check(checks, "db_exists", DATABASE_PATH.exists(), str(DATABASE_PATH))
    add_check(checks, "row_count_matches_clean_csv", len(clean) == len(market_prices), f"csv={len(clean)}, db={len(market_prices)}")
    add_check(checks, "symbol_count_is_51", market_prices["Symbol"].nunique() == 51, f"symbols={market_prices['Symbol'].nunique()}")
    add_check(checks, "nifty_stock_count_is_50", len(constituents) == 50, f"constituents={len(constituents)}")
    add_check(checks, "quality_issue_count_zero", len(quality_issues) == 0, f"quality_issues={len(quality_issues)}")
    add_check(checks, "corporate_actions_present", len(corporate_actions) > 0, f"corporate_actions={len(corporate_actions)}")

    key_result = compare_keys(clean, market_prices)
    add_check(checks, "no_missing_db_keys_vs_clean_csv", key_result["missingInDb"] == 0, f"missing={key_result['missingInDb']}")
    add_check(checks, "no_extra_db_keys_vs_clean_csv", key_result["extraInDb"] == 0, f"extra={key_result['extraInDb']}")

    value_result = compare_values(clean, market_prices)
    add_check(checks, "price_values_match_clean_csv", value_result["mismatchedRows"] == 0, f"mismatched_rows={value_result['mismatchedRows']}")

    symbol_result = validate_symbols(symbols, constituents)
    add_check(checks, "all_constituents_seeded_in_symbols", symbol_result["missingConstituents"] == 0, f"missing={symbol_result['missingConstituents']}")
    add_check(checks, "symbol_metadata_has_sector_and_isin", symbol_result["missingSectorOrIsin"] == 0, f"missing={symbol_result['missingSectorOrIsin']}")

    duplicate_db_keys = int(market_prices.duplicated(subset=["Symbol", "Date"]).sum())
    invalid_ohlc = int(((market_prices["High"] < market_prices["Low"]) | (market_prices["Close"] > market_prices["High"]) | (market_prices["Close"] < market_prices["Low"])).sum())
    add_check(checks, "no_duplicate_symbol_date_in_db", duplicate_db_keys == 0, f"duplicates={duplicate_db_keys}")
    add_check(checks, "no_invalid_ohlc_in_db", invalid_ohlc == 0, f"invalid_ohlc={invalid_ohlc}")

    failed = [check for check in checks if not check["passed"]]
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "pass" if not failed else "fail",
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
        "database": str(DATABASE_PATH),
        "sourceFiles": {
            "cleanPrices": str(CLEAN_PRICES_PATH),
            "nifty50Constituents": str(NIFTY50_CONSTITUENTS_PATH),
        },
        "shape": {
            "cleanCsvRows": int(len(clean)),
            "databaseRows": int(len(market_prices)),
            "symbols": int(market_prices["Symbol"].nunique()),
            "dateStart": str(market_prices["Date"].min()),
            "dateEnd": str(market_prices["Date"].max()),
            "corporateActions": int(len(corporate_actions)),
        },
        "keyComparison": key_result,
        "valueComparison": value_result,
        "symbolComparison": symbol_result,
    }


def normalize_prices(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.copy()
    frame["Date"] = frame["Date"].astype(str)
    frame["Symbol"] = frame["Symbol"].astype(str)
    for column in NUMERIC_COLUMNS:
        if column in frame.columns:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")
    return frame.sort_values(["Symbol", "Date"]).reset_index(drop=True)


def compare_keys(clean: pd.DataFrame, db: pd.DataFrame) -> dict:
    clean_keys = set(zip(clean["Symbol"], clean["Date"]))
    db_keys = set(zip(db["Symbol"], db["Date"]))
    return {
        "cleanKeys": len(clean_keys),
        "dbKeys": len(db_keys),
        "missingInDb": len(clean_keys - db_keys),
        "extraInDb": len(db_keys - clean_keys),
        "missingSample": sorted(list(clean_keys - db_keys))[:10],
        "extraSample": sorted(list(db_keys - clean_keys))[:10],
    }


def compare_values(clean: pd.DataFrame, db: pd.DataFrame) -> dict:
    merged = clean.merge(db, on=["Symbol", "Date"], suffixes=("_csv", "_db"), how="inner")
    mismatch_mask = pd.Series(False, index=merged.index)
    max_abs_diff = {}
    for column in NUMERIC_COLUMNS:
        csv_col = f"{column}_csv"
        db_col = f"{column}_db"
        diff = (merged[csv_col] - merged[db_col]).abs()
        max_abs_diff[column] = float(diff.max(skipna=True) or 0)
        mismatch_mask = mismatch_mask | (diff.fillna(0) > 0.000001)

    mismatches = merged.loc[mismatch_mask, ["Symbol", "Date"]].head(10)
    return {
        "comparedRows": int(len(merged)),
        "mismatchedRows": int(mismatch_mask.sum()),
        "maxAbsDiff": max_abs_diff,
        "mismatchSample": mismatches.to_dict(orient="records"),
    }


def validate_symbols(symbols: pd.DataFrame, constituents: pd.DataFrame) -> dict:
    stock_symbols = set(constituents["Symbol"].astype(str))
    db_symbols = set(symbols["symbol"].astype(str))
    missing = stock_symbols - db_symbols
    missing_sector_or_isin = symbols[
        (symbols["asset_type"] == "stock")
        & (symbols["symbol"].isin(stock_symbols))
        & (symbols[["sector", "industry", "isin"]].isna().any(axis=1) | (symbols[["sector", "industry", "isin"]] == "").any(axis=1))
    ]
    return {
        "constituents": len(stock_symbols),
        "dbSymbols": len(db_symbols),
        "missingConstituents": len(missing),
        "missingSample": sorted(list(missing))[:10],
        "missingSectorOrIsin": int(len(missing_sector_or_isin)),
        "missingSectorOrIsinSample": missing_sector_or_isin["symbol"].head(10).tolist(),
    }


def add_check(checks: list[dict], name: str, passed: bool, detail: str) -> None:
    checks.append({
        "name": name,
        "passed": bool(passed),
        "detail": detail,
    })


def write_report(report: dict) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROFILE_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    REPORT_PATH.write_text(render_markdown(report), encoding="utf-8")


def render_markdown(report: dict) -> str:
    lines = [
        "# Database Correctness Report",
        "",
        f"Generated: `{report['generatedAt']}`",
        f"Status: **{report['status'].upper()}**",
        "",
        "## Source Files",
        "",
        f"- Clean prices: `{report['sourceFiles']['cleanPrices']}`",
        f"- Nifty 50 constituents: `{report['sourceFiles']['nifty50Constituents']}`",
        f"- Database: `{report['database']}`",
        "",
        "## Shape",
        "",
        f"- Clean CSV rows: `{report['shape']['cleanCsvRows']}`",
        f"- Database rows: `{report['shape']['databaseRows']}`",
        f"- Symbols: `{report['shape']['symbols']}`",
        f"- Date range: `{report['shape']['dateStart']}` to `{report['shape']['dateEnd']}`",
        f"- Corporate actions: `{report['shape']['corporateActions']}`",
        "",
        "## Checks",
        "",
        "| Check | Result | Detail |",
        "| --- | --- | --- |",
    ]
    for check in report["checks"]:
        result = "PASS" if check["passed"] else "FAIL"
        lines.append(f"| `{check['name']}` | {result} | {check['detail']} |")
    lines.extend([
        "",
        "## Value Comparison",
        "",
        f"- Compared rows: `{report['valueComparison']['comparedRows']}`",
        f"- Mismatched rows: `{report['valueComparison']['mismatchedRows']}`",
        f"- Max absolute differences: `{report['valueComparison']['maxAbsDiff']}`",
        "",
        "## Conclusion",
        "",
        conclusion(report),
    ])
    return "\n".join(lines)


def conclusion(report: dict) -> str:
    if report["status"] == "pass":
        return "The SQLite database matches the clean ETL output and the Nifty 50 constituent source for the validation checks above."
    return "The database has validation failures. Review the failed checks before using it for dashboard metrics."


if __name__ == "__main__":
    main()

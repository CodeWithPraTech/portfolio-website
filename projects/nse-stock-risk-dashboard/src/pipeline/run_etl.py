"""Refresh market data and produce dashboard-ready numbers.

Examples:
python -m src.pipeline.run_etl --lookback 6mo
python -m src.pipeline.run_etl --lookback 1y
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))

from src.config import (  # noqa: E402
    CLEAN_PRICES_PATH,
    DASHBOARD_SUMMARY_PATH,
    MANIFEST_PATH,
    METADATA_DIR,
    PROCESSED_DIR,
    QUALITY_REPORT_PATH,
    RAW_DIR,
    SYMBOL_NAMES,
    SYMBOL_SECTORS,
    SYMBOLS,
)
from src.database.db import (  # noqa: E402
    begin_refresh_run,
    connect,
    database_counts,
    finish_refresh_run,
    init_database,
    replace_quality_issues,
    upsert_corporate_actions,
    upsert_market_rows,
    write_symbol_counts,
)


FIELDS = [
    "Date",
    "Symbol",
    "Ticker",
    "Open",
    "High",
    "Low",
    "Close",
    "Adj Close",
    "Price Adjustment Factor",
    "Volume",
    "Source",
    "Source URL",
    "Fetch Timestamp",
]


def main() -> None:
    args = parse_args()
    result = run_etl(args.lookback)
    print(json.dumps(result, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh NSE dashboard data.")
    parser.add_argument("--lookback", default="6mo", choices=["6mo", "1y"], help="Window to keep in the clean dashboard dataset.")
    return parser.parse_args()


def run_etl(lookback: str = "6mo") -> dict:
    ensure_dirs()
    end_day = date.today()
    start_day = start_for_lookback(end_day, lookback)
    fetch_timestamp = datetime.now(timezone.utc).isoformat()
    manifest = base_manifest(lookback, start_day, end_day, fetch_timestamp)
    connection = connect()
    init_database(connection)
    run_id = begin_refresh_run(connection, lookback, start_day.isoformat(), end_day.isoformat(), fetch_timestamp)

    try:
        rows = []
        corporate_actions = []
        fetched_counts = {}
        fetch_errors = {}
        rows_by_symbol = {}
        for symbol, ticker in SYMBOLS.items():
            source_url = yahoo_chart_url(ticker, start_day, end_day)
            try:
                symbol_rows, symbol_actions = fetch_yahoo_rows(symbol, ticker, start_day, end_day, fetch_timestamp, source_url)
            except Exception as error:
                symbol_rows = []
                symbol_actions = []
                fetch_errors[symbol] = str(error)
            fetched_counts[symbol] = len(symbol_rows)
            rows_by_symbol[symbol] = symbol_rows
            rows.extend(symbol_rows)
            corporate_actions.extend(symbol_actions)
            write_raw_snapshot(symbol, start_day, end_day, fetch_timestamp, symbol_rows)
            if symbol_rows:
                manifest["symbols"][symbol] = {
                    "ticker": ticker,
                    "last_successful_date": max(row["Date"] for row in symbol_rows),
                    "last_fetch_timestamp": fetch_timestamp,
                    "rows": len(symbol_rows),
                    "source": "Yahoo Finance automated fallback",
                }
            time.sleep(0.2)

        rows = sorted(dedupe_rows(rows), key=lambda row: (row["Symbol"], row["Date"]))
        issues = quality_checks(rows)
        rows_upserted = upsert_market_rows(connection, rows)
        actions_upserted = upsert_corporate_actions(connection, corporate_actions)
        replace_quality_issues(connection, run_id, issues)
        write_symbol_counts(connection, run_id, rows_by_symbol)
        finish_refresh_run(
            connection,
            run_id,
            "success",
            datetime.now(timezone.utc).isoformat(),
            len(rows),
            rows_upserted,
            len(issues),
        )
        db_counts = database_counts(connection)
        summary = build_dashboard_summary(
            rows,
            lookback,
            fetch_timestamp,
            fetched_counts,
            len(issues),
            run_id,
            db_counts,
            corporate_actions,
            actions_upserted,
            fetch_errors,
        )

        write_csv(CLEAN_PRICES_PATH, rows, FIELDS)
        write_quality_report(issues)
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        DASHBOARD_SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        return summary
    except Exception as error:
        finish_refresh_run(
            connection,
            run_id,
            "failed",
            datetime.now(timezone.utc).isoformat(),
            0,
            0,
            0,
            str(error),
        )
        raise
    finally:
        connection.close()


def ensure_dirs() -> None:
    for path in [RAW_DIR, CLEAN_PRICES_PATH.parent, PROCESSED_DIR, METADATA_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def start_for_lookback(end_day: date, lookback: str) -> date:
    if lookback == "1y":
        return end_day - timedelta(days=365)
    return end_day - timedelta(days=183)


def base_manifest(lookback: str, start_day: date, end_day: date, fetch_timestamp: str) -> dict:
    return {
        "source": "Yahoo Finance automated fallback for NSE tickers",
        "source_note": "Official NSE pages remain the source-of-truth reference; Yahoo Finance is used for reproducible automated refreshes.",
        "lookback": lookback,
        "window_start": start_day.isoformat(),
        "window_end": end_day.isoformat(),
        "last_refresh_timestamp": fetch_timestamp,
        "symbols": {},
    }


def yahoo_chart_url(ticker: str, start_day: date, end_day: date) -> str:
    query = urlencode({
        "period1": to_unix(start_day),
        "period2": to_unix(end_day + timedelta(days=1)),
        "interval": "1d",
        "events": "div,splits,history",
        "includeAdjustedClose": "true",
    })
    return f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(ticker, safe='^.')}?{query}"


def to_unix(day: date) -> int:
    return int(datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc).timestamp())


def fetch_yahoo_rows(symbol: str, ticker: str, start_day: date, end_day: date, fetch_timestamp: str, source_url: str) -> tuple[list[dict], list[dict]]:
    request = Request(source_url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))

    result = payload.get("chart", {}).get("result", [{}])[0]
    timestamps = result.get("timestamp") or []
    quote = (result.get("indicators", {}).get("quote") or [{}])[0]
    adjclose = (result.get("indicators", {}).get("adjclose") or [{}])[0].get("adjclose") or []
    events = result.get("events") or {}
    rows = []

    for index, ts in enumerate(timestamps):
        close = value_at(quote, "close", index)
        if close is None:
            continue
        adj_close = adjclose[index] if index < len(adjclose) and adjclose[index] is not None else close
        rows.append({
            "Date": datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat(),
            "Symbol": symbol,
            "Ticker": ticker,
            "Open": value_at(quote, "open", index),
            "High": value_at(quote, "high", index),
            "Low": value_at(quote, "low", index),
            "Close": close,
            "Adj Close": adj_close,
            "Price Adjustment Factor": adj_close / close if close else None,
            "Volume": value_at(quote, "volume", index) or 0,
            "Source": "Yahoo Finance automated fallback",
            "Source URL": source_url,
            "Fetch Timestamp": fetch_timestamp,
        })
    return rows, parse_corporate_actions(symbol, events, source_url, fetch_timestamp)


def parse_corporate_actions(symbol: str, events: dict, source_url: str, fetch_timestamp: str) -> list[dict]:
    actions = []
    for event in (events.get("dividends") or {}).values():
        action_date = datetime.fromtimestamp(event["date"], tz=timezone.utc).date().isoformat()
        actions.append({
            "Symbol": symbol,
            "Action Date": action_date,
            "Action Type": "dividend",
            "Dividend Amount": event.get("amount"),
            "Split Numerator": None,
            "Split Denominator": None,
            "Split Ratio": None,
            "Source": "Yahoo Finance automated fallback",
            "Source URL": source_url,
            "Fetch Timestamp": fetch_timestamp,
        })
    for event in (events.get("splits") or {}).values():
        action_date = datetime.fromtimestamp(event["date"], tz=timezone.utc).date().isoformat()
        actions.append({
            "Symbol": symbol,
            "Action Date": action_date,
            "Action Type": "split",
            "Dividend Amount": None,
            "Split Numerator": event.get("numerator"),
            "Split Denominator": event.get("denominator"),
            "Split Ratio": event.get("splitRatio"),
            "Source": "Yahoo Finance automated fallback",
            "Source URL": source_url,
            "Fetch Timestamp": fetch_timestamp,
        })
    return actions


def value_at(container: dict, key: str, index: int):
    values = container.get(key) or []
    return values[index] if index < len(values) else None


def write_raw_snapshot(symbol: str, start_day: date, end_day: date, fetch_timestamp: str, rows: list[dict]) -> None:
    if not rows:
        return
    raw_path = RAW_DIR / f"{symbol}_{start_day.isoformat()}_to_{end_day.isoformat()}_{fetch_timestamp[:10]}.csv"
    write_csv(raw_path, rows, FIELDS)


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def dedupe_rows(rows: list[dict]) -> list[dict]:
    by_key = {(row["Symbol"], row["Date"]): row for row in rows}
    return list(by_key.values())


def quality_checks(rows: list[dict]) -> list[list[str]]:
    issues = []
    seen = set()
    for row in rows:
        key = (row["Symbol"], row["Date"])
        if key in seen:
            issues.append([row["Symbol"], row["Date"], "duplicate_symbol_date"])
        seen.add(key)
        for column in ["Open", "High", "Low", "Close", "Volume"]:
            value = safe_float(row[column])
            if value is None:
                issues.append([row["Symbol"], row["Date"], f"invalid_{column}"])
            elif value < 0:
                issues.append([row["Symbol"], row["Date"], f"negative_{column}"])
        high = safe_float(row["High"])
        low = safe_float(row["Low"])
        close = safe_float(row["Close"])
        if high is not None and low is not None and high < low:
            issues.append([row["Symbol"], row["Date"], "high_less_than_low"])
        if high is not None and low is not None and close is not None and not low <= close <= high:
            issues.append([row["Symbol"], row["Date"], "close_outside_high_low"])
    return issues


def write_quality_report(issues: list[list[str]]) -> None:
    QUALITY_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with QUALITY_REPORT_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["Symbol", "Date", "Issue"])
        writer.writerows(issues)


def build_dashboard_summary(
    rows: list[dict],
    lookback: str,
    fetch_timestamp: str,
    fetched_counts: dict,
    quality_issue_count: int,
    run_id: int,
    db_counts: dict,
    corporate_actions: list[dict],
    actions_upserted: int,
    fetch_errors: dict,
) -> dict:
    by_symbol = {}
    for row in rows:
        by_symbol.setdefault(row["Symbol"], []).append(row)

    stocks = []
    for symbol in SYMBOLS:
        symbol_rows = sorted(by_symbol.get(symbol, []), key=lambda item: item["Date"])
        if not symbol_rows:
            stocks.append({"symbol": symbol, "name": SYMBOL_NAMES[symbol], "rows": 0})
            continue
        latest = symbol_rows[-1]
        previous = symbol_rows[-2] if len(symbol_rows) > 1 else latest
        first = symbol_rows[0]
        latest_close = safe_float(latest["Close"]) or 0
        previous_close = safe_float(previous["Close"]) or latest_close
        first_close = safe_float(first["Close"]) or latest_close
        day_change = latest_close - previous_close
        day_change_pct = pct_change(latest_close, previous_close)
        window_change_pct = pct_change(latest_close, first_close)
        avg_volume = average([safe_float(row["Volume"]) for row in symbol_rows])
        latest_volume = safe_float(latest["Volume"]) or 0
        stocks.append({
            "symbol": symbol,
            "name": SYMBOL_NAMES[symbol],
            "sector": SYMBOL_SECTORS[symbol]["sector"],
            "industry": SYMBOL_SECTORS[symbol]["industry"],
            "niftySectorIndex": SYMBOL_SECTORS[symbol]["nifty_sector_index"],
            "rows": len(symbol_rows),
            "latestDate": latest["Date"],
            "latestClose": round(latest_close, 2),
            "dayChange": round(day_change, 2),
            "dayChangePct": round(day_change_pct, 2),
            "windowChangePct": round(window_change_pct, 2),
            "latestVolume": int(latest_volume),
            "averageVolume": int(avg_volume),
            "volumeVsAverage": round(latest_volume / avg_volume, 2) if avg_volume else None,
        })

    latest_dates = [stock.get("latestDate") for stock in stocks if stock.get("latestDate")]
    actions_by_symbol = {}
    for action in corporate_actions:
        actions_by_symbol.setdefault(action["Symbol"], []).append(action)
    return {
        "status": "ok",
        "lookback": lookback,
        "refreshedAt": fetch_timestamp,
        "latestDate": max(latest_dates) if latest_dates else None,
        "rowCount": len(rows),
        "symbolCount": len(stocks),
        "qualityIssues": quality_issue_count,
        "fetchedRows": fetched_counts,
        "databaseRunId": run_id,
        "corporateActionsFetched": len(corporate_actions),
        "corporateActionsUpserted": actions_upserted,
        "corporateActionsBySymbol": {symbol: len(actions_by_symbol.get(symbol, [])) for symbol in SYMBOLS},
        "fetchErrors": fetch_errors,
        "priceClarity": {
            "close": "Raw market close from the source.",
            "adjClose": "Adjusted close from source, used for return/risk calculations when corporate actions affect historical comparability.",
            "priceAdjustmentFactor": "adj_close / close. A value below 1 usually indicates historical adjustment from dividends/splits.",
        },
        **db_counts,
        "stocks": stocks,
    }


def pct_change(current: float, previous: float) -> float:
    if previous == 0:
        return 0
    return ((current - previous) / previous) * 100


def average(values) -> float:
    clean_values = [value for value in values if value is not None and not math.isnan(value)]
    return sum(clean_values) / len(clean_values) if clean_values else 0


def safe_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


if __name__ == "__main__":
    main()

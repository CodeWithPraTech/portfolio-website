"""Refresh 30-minute intraday candles.

Examples:
python -m src.pipeline.run_intraday_etl
python -m src.pipeline.run_intraday_etl --days 365
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))

from src.config import METADATA_DIR, RAW_DIR, SYMBOLS  # noqa: E402
from src.database.db import (  # noqa: E402
    begin_refresh_run,
    connect,
    database_counts,
    finish_refresh_run,
    init_database,
    upsert_intraday_rows,
)


INTERVAL_MINUTES = 30
DEFAULT_INTRADAY_DAYS = 365
YAHOO_INTRADAY_FALLBACK_DAYS = 59
FIELDS = [
    "Interval Start",
    "Interval End",
    "Interval Minutes",
    "Symbol",
    "Ticker",
    "Open",
    "High",
    "Low",
    "Close",
    "Volume",
    "Source",
    "Source URL",
    "Fetch Timestamp",
]


def main() -> None:
    args = parse_args()
    result = run_intraday_etl(args.days)
    print(json.dumps(result, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh 30-minute NSE intraday candles.")
    parser.add_argument(
        "--days",
        type=int,
        default=DEFAULT_INTRADAY_DAYS,
        help="Recent calendar days to request. Default is 365, but Yahoo may return less intraday history.",
    )
    return parser.parse_args()


def run_intraday_etl(days: int = DEFAULT_INTRADAY_DAYS) -> dict:
    end_at = datetime.now(timezone.utc)
    start_at = end_at - timedelta(days=days)
    fetch_timestamp = end_at.isoformat()
    connection = connect()
    init_database(connection)
    run_id = begin_refresh_run(
        connection,
        "30m",
        start_at.date().isoformat(),
        end_at.date().isoformat(),
        fetch_timestamp,
    )

    try:
        rows = []
        fetched_counts = {}
        fetch_errors = {}
        fetch_warnings = {}
        for symbol, ticker in SYMBOLS.items():
            source_url = yahoo_intraday_url(ticker, start_at, end_at)
            try:
                symbol_rows = fetch_yahoo_intraday_rows(symbol, ticker, source_url, fetch_timestamp)
            except Exception as error:
                if days > YAHOO_INTRADAY_FALLBACK_DAYS and is_provider_range_error(error):
                    fallback_start_at = end_at - timedelta(days=YAHOO_INTRADAY_FALLBACK_DAYS)
                    fallback_url = yahoo_intraday_url(ticker, fallback_start_at, end_at)
                    try:
                        symbol_rows = fetch_yahoo_intraday_rows(symbol, ticker, fallback_url, fetch_timestamp)
                        fetch_warnings[symbol] = (
                            f"Requested {days} days failed with provider range error; "
                            f"used {YAHOO_INTRADAY_FALLBACK_DAYS} days instead."
                        )
                    except Exception as fallback_error:
                        symbol_rows = []
                        fetch_errors[symbol] = str(fallback_error)
                else:
                    symbol_rows = []
                    fetch_errors[symbol] = str(error)
            fetched_counts[symbol] = len(symbol_rows)
            rows.extend(symbol_rows)
            write_raw_snapshot(symbol, fetch_timestamp, symbol_rows)
            time.sleep(0.2)

        rows = sorted(dedupe_rows(rows), key=lambda row: (row["Symbol"], row["Interval Start"]))
        rows_upserted = upsert_intraday_rows(connection, rows)
        finish_refresh_run(
            connection,
            run_id,
            "success",
            datetime.now(timezone.utc).isoformat(),
            len(rows),
            rows_upserted,
            len(fetch_errors),
            "; ".join(f"{symbol}: {error}" for symbol, error in fetch_errors.items()) or None,
        )
        summary = build_intraday_summary(
            connection,
            rows,
            fetched_counts,
            fetch_errors,
            fetch_warnings,
            days,
            run_id,
            fetch_timestamp,
        )
        summary_path = METADATA_DIR / "intraday_30m_summary.json"
        summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
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


def yahoo_intraday_url(ticker: str, start_at: datetime, end_at: datetime) -> str:
    query = urlencode({
        "period1": int(start_at.timestamp()),
        "period2": int(end_at.timestamp()),
        "interval": "30m",
        "events": "history",
        "includePrePost": "false",
    })
    return f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(ticker, safe='^.')}?{query}"


def fetch_yahoo_intraday_rows(symbol: str, ticker: str, source_url: str, fetch_timestamp: str) -> list[dict]:
    request = Request(source_url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))

    chart = payload.get("chart", {})
    error = chart.get("error")
    if error:
        raise RuntimeError(error.get("description") or error.get("code") or "Yahoo Finance chart error")

    results = chart.get("result") or []
    if not results:
        raise RuntimeError("Yahoo Finance returned no intraday result")

    result = results[0]
    timestamps = result.get("timestamp") or []
    quote = (result.get("indicators", {}).get("quote") or [{}])[0]
    rows = []

    for index, ts in enumerate(timestamps):
        close = value_at(quote, "close", index)
        if close is None:
            continue
        start = datetime.fromtimestamp(ts, tz=timezone.utc)
        end = start + timedelta(minutes=INTERVAL_MINUTES)
        rows.append({
            "Interval Start": start.isoformat(),
            "Interval End": end.isoformat(),
            "Interval Minutes": INTERVAL_MINUTES,
            "Symbol": symbol,
            "Ticker": ticker,
            "Open": value_at(quote, "open", index),
            "High": value_at(quote, "high", index),
            "Low": value_at(quote, "low", index),
            "Close": close,
            "Volume": value_at(quote, "volume", index) or 0,
            "Source": "Yahoo Finance automated fallback",
            "Source URL": source_url,
            "Fetch Timestamp": fetch_timestamp,
        })
    return rows


def is_provider_range_error(error: Exception) -> bool:
    message = str(error)
    return "HTTP Error 422" in message or "range" in message.lower()


def value_at(container: dict, key: str, index: int):
    values = container.get(key) or []
    return values[index] if index < len(values) else None


def write_raw_snapshot(symbol: str, fetch_timestamp: str, rows: list[dict]) -> None:
    if not rows:
        return
    raw_dir = RAW_DIR / "intraday_30m"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_path = raw_dir / f"{symbol}_30m_{fetch_timestamp[:10]}.csv"
    with raw_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def dedupe_rows(rows: list[dict]) -> list[dict]:
    by_key = {
        (row["Symbol"], row["Interval Start"], row["Interval Minutes"]): row
        for row in rows
    }
    return list(by_key.values())


def build_intraday_summary(
    connection,
    rows: list[dict],
    fetched_counts: dict,
    fetch_errors: dict,
    fetch_warnings: dict,
    days: int,
    run_id: int,
    fetch_timestamp: str,
) -> dict:
    counts = database_counts(connection)
    latest_rows = [
        dict(row)
        for row in connection.execute(
            """
            SELECT symbol, name, sector, industry, interval_start, interval_minutes,
                   open, high, low, close, volume
            FROM latest_intraday_prices
            ORDER BY symbol
            """
        ).fetchall()
    ]
    return {
        "status": "ok",
        "interval": "30m",
        "requestedDays": days,
        "refreshedAt": fetch_timestamp,
        "rowsFetched": len(rows),
        "fetchedRows": fetched_counts,
        "fetchErrorCount": len(fetch_errors),
        "fetchErrors": fetch_errors,
        "fetchWarningCount": len(fetch_warnings),
        "fetchWarnings": fetch_warnings,
        "fallbackDays": YAHOO_INTRADAY_FALLBACK_DAYS if fetch_warnings else None,
        "databaseRunId": run_id,
        **counts,
        "latest": latest_rows,
    }


if __name__ == "__main__":
    main()

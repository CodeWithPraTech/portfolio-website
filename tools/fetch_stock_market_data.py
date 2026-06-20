import csv
import json
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data" / "stock_market"
RAW_DIR = DATA_ROOT / "raw" / "yahoo_finance"
CLEAN_DIR = DATA_ROOT / "clean"
META_DIR = DATA_ROOT / "metadata"

PILOT_SYMBOLS = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "INFY": "INFY.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "NIFTY50": "^NSEI",
}

DEFAULT_START_DATE = "2024-01-01"
MANIFEST_PATH = META_DIR / "ingestion_manifest.json"
CLEAN_PATH = CLEAN_DIR / "stock_prices.csv"
QUALITY_PATH = META_DIR / "data_quality_report.csv"


def ensure_dirs():
    for path in [RAW_DIR, CLEAN_DIR, META_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def load_manifest():
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {
        "source": "Yahoo Finance automated fallback for NSE tickers",
        "source_note": (
            "Use official NSE Security-wise Price Volume Archives and NIFTY historical index data "
            "as source-of-truth references. This script uses Yahoo Finance only as a real-data "
            "automated fallback when NSE blocks scripted downloads."
        ),
        "symbols": {},
    }


def save_manifest(manifest):
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def to_unix(day):
    dt = datetime.strptime(day, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return int(dt.timestamp())


def next_day(day):
    return (datetime.strptime(day, "%Y-%m-%d").date() + timedelta(days=1)).isoformat()


def fetch_yahoo_rows(symbol, ticker, start_date, end_date, fetch_timestamp, source_url):
    # Yahoo's period2 is exclusive, so add one day to include end_date.
    period1 = to_unix(start_date)
    period2 = to_unix((datetime.strptime(end_date, "%Y-%m-%d").date() + timedelta(days=1)).isoformat())
    query = urlencode({
        "period1": period1,
        "period2": period2,
        "interval": "1d",
        "events": "history",
        "includeAdjustedClose": "true",
    })
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?{query}"
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))
    result = payload.get("chart", {}).get("result", [{}])[0]
    timestamps = result.get("timestamp") or []
    quote = (result.get("indicators", {}).get("quote") or [{}])[0]
    adjclose = (result.get("indicators", {}).get("adjclose") or [{}])[0].get("adjclose") or []
    rows = []
    for index, ts in enumerate(timestamps):
        close = quote.get("close", [None] * len(timestamps))[index]
        if close is None:
            continue
        day = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
        rows.append({
            "Date": day,
            "Symbol": symbol,
            "Ticker": ticker,
            "Open": quote.get("open", [None] * len(timestamps))[index],
            "High": quote.get("high", [None] * len(timestamps))[index],
            "Low": quote.get("low", [None] * len(timestamps))[index],
            "Close": close,
            "Adj Close": adjclose[index] if index < len(adjclose) else close,
            "Volume": quote.get("volume", [0] * len(timestamps))[index],
            "Source": "Yahoo Finance automated fallback",
            "Source URL": source_url,
            "Fetch Timestamp": fetch_timestamp,
        })
    return rows


def read_existing_rows():
    if not CLEAN_PATH.exists():
        return []
    with CLEAN_PATH.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_clean_rows(rows):
    fields = [
        "Date", "Symbol", "Ticker", "Open", "High", "Low", "Close", "Adj Close",
        "Volume", "Source", "Source URL", "Fetch Timestamp",
    ]
    with CLEAN_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def quality_checks(rows):
    issues = []
    seen = set()
    for row in rows:
        key = (row["Symbol"], row["Date"])
        if key in seen:
            issues.append([row["Symbol"], row["Date"], "duplicate_symbol_date"])
        seen.add(key)
        for col in ["Open", "High", "Low", "Close", "Volume"]:
            try:
                value = float(row[col])
            except ValueError:
                issues.append([row["Symbol"], row["Date"], f"invalid_{col}"])
                continue
            if value < 0:
                issues.append([row["Symbol"], row["Date"], f"negative_{col}"])
        try:
            high = float(row["High"])
            low = float(row["Low"])
            close = float(row["Close"])
            if high < low:
                issues.append([row["Symbol"], row["Date"], "high_less_than_low"])
            if not (low <= close <= high):
                issues.append([row["Symbol"], row["Date"], "close_outside_high_low"])
        except ValueError:
            pass
    return issues


def write_quality_report(issues):
    with QUALITY_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["Symbol", "Date", "Issue"])
        writer.writerows(issues)


def main():
    ensure_dirs()
    manifest = load_manifest()
    today = date.today().isoformat()
    fetch_timestamp = datetime.now(timezone.utc).isoformat()
    existing_rows = read_existing_rows()
    by_key = {(row["Symbol"], row["Date"]): row for row in existing_rows}
    appended = {}

    for symbol, ticker in PILOT_SYMBOLS.items():
        last_date = manifest["symbols"].get(symbol, {}).get("last_successful_date")
        start_date = next_day(last_date) if last_date else DEFAULT_START_DATE
        if start_date > today:
            appended[symbol] = 0
            continue

        period1 = to_unix(start_date)
        period2 = to_unix((datetime.strptime(today, "%Y-%m-%d").date() + timedelta(days=1)).isoformat())
        source_url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?period1={period1}&period2={period2}&interval=1d&events=history&includeAdjustedClose=true"
        new_rows = fetch_yahoo_rows(symbol, ticker, start_date, today, fetch_timestamp, source_url)

        raw_path = RAW_DIR / f"{symbol}_{start_date}_to_{today}_{fetch_timestamp[:10]}.csv"
        if new_rows:
            with raw_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=new_rows[0].keys())
                writer.writeheader()
                writer.writerows(new_rows)

        for row in new_rows:
            by_key[(row["Symbol"], row["Date"])] = row
        appended[symbol] = len(new_rows)
        if new_rows:
            manifest["symbols"][symbol] = {
                "ticker": ticker,
                "last_successful_date": max(row["Date"] for row in new_rows),
                "last_fetch_timestamp": fetch_timestamp,
                "source": "Yahoo Finance automated fallback",
            }
        time.sleep(0.5)

    all_rows = sorted(by_key.values(), key=lambda row: (row["Symbol"], row["Date"]))
    issues = quality_checks(all_rows)
    write_clean_rows(all_rows)
    write_quality_report(issues)
    save_manifest(manifest)

    print(json.dumps({
        "clean_path": str(CLEAN_PATH),
        "manifest_path": str(MANIFEST_PATH),
        "quality_report": str(QUALITY_PATH),
        "total_rows": len(all_rows),
        "appended": appended,
        "quality_issues": len(issues),
    }, indent=2))


if __name__ == "__main__":
    main()

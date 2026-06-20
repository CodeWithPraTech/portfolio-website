"""Data quality checks for OHLCV market data."""

REQUIRED_COLUMNS = {
    "Date",
    "Symbol",
    "Ticker",
    "Open",
    "High",
    "Low",
    "Close",
    "Adj Close",
    "Volume",
}


def validate_prices(frame):
    issues = []
    missing_columns = REQUIRED_COLUMNS - set(frame.columns)
    if missing_columns:
        issues.append(f"Missing columns: {', '.join(sorted(missing_columns))}")

    if {"High", "Low", "Open", "Close"}.issubset(frame.columns):
        invalid_ohlc = frame[(frame["High"] < frame["Low"]) | (frame["Open"] <= 0) | (frame["Close"] <= 0)]
        if len(invalid_ohlc):
            issues.append(f"Invalid OHLC rows: {len(invalid_ohlc)}")

    if {"Symbol", "Date"}.issubset(frame.columns):
        duplicate_count = frame.duplicated(subset=["Symbol", "Date"]).sum()
        if duplicate_count:
            issues.append(f"Duplicate Symbol-Date rows: {duplicate_count}")

    return issues

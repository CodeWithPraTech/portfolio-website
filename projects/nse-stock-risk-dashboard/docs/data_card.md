# Data Card: NSE Stock Risk Intelligence Dashboard

## Dataset Name

NSE Stock + NIFTY50 Daily Market Data

## Business Purpose

Support a stakeholder dashboard that shows stock risk, volatility, drawdown, trend quality, liquidity, and position-sizing guidance.

## Current Universe

| Symbol | Instrument |
|---|---|
| RELIANCE | Reliance Industries |
| TCS | Tata Consultancy Services |
| HDFCBANK | HDFC Bank |
| INFY | Infosys |
| ICICIBANK | ICICI Bank |
| NIFTY50 | NIFTY 50 benchmark |

## Source Policy

Official source-of-truth references:

- NSE Security-wise Price Volume Archives: https://www.nseindia.com/report-detail/eq_security
- NSE Historical Reports: https://www.nseindia.com/resources/historical-reports-capital-market-daily-monthly-archives
- NSE Historical Index Data: https://www.nseindia.com/reports-indices-historical-index-data
- NIFTY Indices Historical Data: https://www.niftyindices.com/reports/historical-data

Automated real-data fallback:

- Yahoo Finance chart API for NSE tickers

Reason:

NSE pages can block scripted download sessions. The project keeps NSE as the official reference and uses an automated real-data fallback for reproducible development.

## Current Data Location

```text
data/stock_market/clean/stock_prices.csv
data/stock_market/metadata/ingestion_manifest.json
data/stock_market/metadata/data_quality_report.csv
```

## Grain

One row per `Symbol + Date`.

## Current Fields

- Date
- Symbol
- Ticker
- Open
- High
- Low
- Close
- Adj Close
- Volume
- Source
- Source URL
- Fetch Timestamp

## Validation Checks

- No duplicate `Symbol + Date`.
- Date is valid.
- OHLC values are non-negative.
- High is greater than or equal to Low.
- Close is between High and Low.
- Volume is non-negative.
- Source URL and fetch timestamp are stored.

## Known Limitations

- Current automated data source is a fallback, not the official NSE endpoint.
- Corporate actions need deeper review before production analytics.
- Trading holidays and source gaps must be documented.
- Intraday data is out of scope for version 1.

## Refresh Policy

The ingestion manifest stores `last_successful_date` per symbol. Each run fetches only dates after the previous successful date, appends new rows, removes duplicates, validates quality, and updates the manifest only after success.

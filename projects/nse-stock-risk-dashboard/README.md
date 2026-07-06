# NSE Stock Risk Dashboard

This is a standalone stock-risk analytics project inside the portfolio workspace.

The project is now organized so it can grow like a real data product:

```text
nse-stock-risk-dashboard/
  data/
    raw/
    clean/
    processed/
    metadata/
    database/
  notebooks/
    01_data_exploration.ipynb
    02_risk_metrics.ipynb
    03_dashboard_prototype.ipynb
  src/
    ingestion/
      fetch_market_data.py
      append_data.py
    validation/
      quality_checks.py
    features/
      risk_features.py
      return_features.py
    analytics/
      volatility.py
      drawdown.py
      beta.py
      correlation.py
    dashboard/
      app.py
  reports/
    data_card.md
    methodology.md
    stakeholder_summary.md
  tools/
    daily_refresh.ps1
  site/
    index.html
    styles.css
    server.mjs
  README.md
```

## Current Site

The current site is intentionally blank and light-mode. It only shows the name:

```text
Market Mind
```

This gives the project a clean starting point before choosing the final product direction.

## Run The Site

From the portfolio workspace root:

```bash
node projects/nse-stock-risk-dashboard/site/server.mjs
```

Open:

```text
http://localhost:4184
```

Every page load calls the dashboard API, which refreshes the latest market data before showing numbers.

Available windows:

- `6 months`
- `1 year`

## Run The ETL Directly

From the project root:

```bash
python -m src.pipeline.run_etl --lookback 6mo
python -m src.pipeline.run_etl --lookback 1y
python -m src.pipeline.run_intraday_etl --days 30
```

The ETL writes:

- SQLite database: `data/database/market_data.db`
- Clean OHLCV data: `data/clean/stock_prices.csv`
- Dashboard summary: `data/processed/dashboard_summary.json`
- Manifest: `data/metadata/ingestion_manifest.json`
- Quality report: `data/metadata/data_quality_report.csv`
- Raw snapshots: `data/raw/yahoo_finance/`

## Database

Create or update the database schema:

```bash
python -m src.database.init_db
```

Inspect current database status:

```bash
python -m src.database.inspect_db
```

Main tables:

- `symbols`: stock and benchmark universe
- `market_prices`: daily OHLCV rows with source and fetch metadata
- `market_intraday_prices`: 30-minute OHLCV candles with source and fetch metadata
- `refresh_runs`: each daily/API refresh attempt
- `refresh_symbol_counts`: rows fetched per symbol per run
- `quality_issues`: validation issues found during refresh

`symbols` stores `sector`, `industry`, and `nifty_sector_index` for each stock. `market_prices` uses `(symbol, trade_date)` as the primary key, so daily refreshes update existing rows and add new dates without duplicates.

`market_intraday_prices` uses `(symbol, interval_start, interval_minutes)` as the primary key, so 30-minute refreshes update the active/recent candles and add new intervals without duplicates.

## Daily Refresh

Manual daily refresh command:

```bash
python -m src.pipeline.run_etl --lookback 6mo
```

Windows PowerShell helper:

```powershell
.\tools\daily_refresh.ps1
```

This script is ready to attach to Windows Task Scheduler for a daily run. The website API also triggers the same ETL when the dashboard is opened or refreshed.

## Full-Stack Entry Point

A Python dashboard server is also available:

```bash
cd projects/nse-stock-risk-dashboard
python src/dashboard/app.py
```

Current backend endpoint:

```text
GET /api/health
GET /api/dashboard-summary?lookback=6mo
GET /api/dashboard-summary?lookback=1y
GET /api/intraday-30m?symbol=RELIANCE&limit=80
GET /api/corporate-actions?symbol=ALL
```

Corporate-action handling:

- Dividends and splits are stored in `corporate_actions`.
- Daily prices store both `close` and `adj_close`.
- `price_adjustment_factor = adj_close / close` makes raw-vs-adjusted clarity explicit.
- Return and risk features should use `adj_close` by default; price display should use raw `close`.

## Data

The project contains its own copy of the current market dataset:

- Raw market files: `data/raw/`
- Clean market file: `data/clean/stock_prices.csv`
- Metadata and quality report: `data/metadata/`
- Future feature tables: `data/processed/`
- Nifty 50 universe source: `data/metadata/nifty50_constituents.csv`

The stock universe is loaded from the official NSE/Nifty Indices constituent CSV. The ETL also includes `NIFTY50` as the benchmark index.

## Current Site Behavior

The site keeps the name simple, then shows recent numbers after the refresh completes. This keeps the product direction flexible while proving the data pipeline works.

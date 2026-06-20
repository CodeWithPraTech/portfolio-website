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

## Full-Stack Entry Point

A Python dashboard server is also available:

```bash
cd projects/nse-stock-risk-dashboard
python src/dashboard/app.py
```

Current backend endpoint:

```text
GET /api/health
```

## Data

The project contains its own copy of the current market dataset:

- Raw market files: `data/raw/`
- Clean market file: `data/clean/stock_prices.csv`
- Metadata and quality report: `data/metadata/`
- Future feature tables: `data/processed/`

## Next Step

Choose the site direction first. Once the concept is clear, build the interface gradually instead of adding charts and finance language too early.

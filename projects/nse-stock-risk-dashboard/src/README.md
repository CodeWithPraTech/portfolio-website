# Source Layout

This folder contains the production-oriented modules for the stock risk dashboard.

Planned modules:

```text
src/
  ingestion/
  validation/
  features/
  dashboard/
  decision_engine/
```

Current canonical ingestion script:

```text
../../tools/fetch_stock_market_data.py
```

As the project matures, ingestion logic should move from `tools/` into `src/ingestion/` and expose a reusable CLI.

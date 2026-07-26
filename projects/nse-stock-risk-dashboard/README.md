# Market Mind: NSE Stock Risk Intelligence

Market Mind is a live, plain-language risk dashboard for the NIFTY 50. It turns daily and 30-minute market data into understandable answers about price behaviour, downside risk, market sensitivity, sector concentration, and position sizing.

The dashboard is educational. It describes measured historical evidence and does not issue buy or sell recommendations.

## What The Product Does

- Covers all 50 current NIFTY 50 constituents plus NIFTY 50 as the benchmark.
- Stores three years of daily open, high, low, close, adjusted close, and volume.
- Stores recent 30-minute candles where Yahoo Finance makes them available.
- Shows a clickable candlestick detail view for every stock.
- Measures volatility, drawdown, beta, correlation, historical tail loss, trading range, liquidity, trend, and momentum.
- Compares sector-level risk across the NIFTY 50 universe.
- Records dividends and splits and clearly separates raw from adjusted prices.
- Provides a risk-based position-size illustration from a user-entered portfolio value and loss budget.
- Accepts plain questions such as `Why is Reliance risky?`, `What do the signals say about TCS?`, or `Compare Infosys with Wipro`.
- Explains each answer as `What`, `Why`, and `How to use it` using only the dashboard's measured signals.
- Requests the latest available quote for the selected stock while keeping the full risk calculation reproducible from the stored dataset.

## Product Screens

The light-mode web application contains:

1. **Ask the signals**: natural-language questions answered from transparent rules.
2. **Market summary**: NIFTY level, breadth, returns, higher-risk count, and data health.
3. **Risk monitor**: searchable and sortable coverage of all NIFTY 50 stocks.
4. **Stock detail**: daily or 30-minute candlesticks, returns, risk measures, signal checks, and corporate actions.
5. **Position-size planner**: an illustrative quantity based on a user-defined risk budget.
6. **Sector risk map**: sector averages and member-level drill-down.
7. **Method page**: plain-language definitions, coverage, assumptions, and limitations.

## Architecture

```text
Official NIFTY universe + Yahoo Finance
                  |
                  v
        Python ETL and validation
                  |
                  v
        SQLite market_data.db
                  |
                  v
       Risk analytics payload builder
                  |
                  v
   Deployable Next/vinext web application
                  |
       +----------+-----------+
       |                      |
 stored risk evidence   latest quote endpoint
```

The stored analytics and live quote are deliberately separated. Historical risk metrics are reproducible and internally consistent; the latest quote may be delayed and does not silently rewrite the risk calculation.

## Project Structure

```text
nse-stock-risk-dashboard/
  data/
    raw/                    Source snapshots
    clean/                  Validated daily market file
    processed/              Dashboard and validation outputs
    metadata/               Universe, manifests, and quality reports
    database/               SQLite database
  notebooks/
    01_data_exploration.ipynb
    02_risk_metrics.ipynb
    03_dashboard_prototype.ipynb
  src/
    ingestion/              Market-data fetch helpers
    validation/             Data-quality checks
    features/               Return and risk feature preparation
    analytics/              Risk calculations and web payload builder
    database/               Schema, initialization, and queries
    pipeline/               Daily and 30-minute ETL
    dashboard/              Legacy local Python entry point
  reports/                  Data card, methodology, validation, and stakeholder notes
  docs/
    PROJECT_DOCUMENTATION.md
  tools/
    daily_refresh.ps1
  site/                     Earlier lightweight local interface
  web/                      Production dashboard and deployment source
  README.md
```

## Data Coverage

Current validated snapshot:

- Daily rows: `37,756`
- Daily symbols: `51` including the NIFTY 50 benchmark
- Daily range: `07 Jul 2023` to `06 Jul 2026`
- Recent 30-minute rows: `25,895`
- Corporate-action records: `243`
- Stored data-quality issues: `0`

Run the database inspection at any time for current counts:

```powershell
python -m src.database.inspect_db
```

## Run Locally

### 1. Refresh the analytics payload

From the project directory:

```powershell
python -m src.analytics.build_dashboard_payload
```

### 2. Start the production web application

```powershell
cd web
pnpm install
pnpm dev -- --port 4184
```

Open `http://localhost:4184`.

### 3. Refresh source data

The full daily refresh can take several minutes because it covers 51 symbols:

```powershell
python -m src.pipeline.run_etl --lookback 3y
python -m src.pipeline.run_intraday_etl --days 365
python -m src.analytics.build_dashboard_payload
```

The Windows helper runs the daily pipeline:

```powershell
.\tools\daily_refresh.ps1
```

## Risk Measures

| Measure | Plain meaning | Main use |
|---|---|---|
| Annualised volatility | How widely daily returns have moved | Compare price instability |
| Maximum drawdown | Largest fall from a previous high | Understand historical downside depth |
| Beta | Typical stock move when NIFTY moves by 1% | Measure market sensitivity |
| Correlation | How consistently stock and NIFTY moved together | Understand diversification |
| 95% historical bad-day estimate | Daily loss threshold exceeded about 5% of the time | Set loss expectations |
| Expected shortfall | Average loss within the worst 5% of days | Understand tail severity |
| ATR | Average daily trading range | Create a price-aware stop-distance illustration |
| Liquidity | Average 20-day rupee trading value | Identify execution risk |
| Signal score | Trend, momentum, relative strength, and risk buffer | Summarise current historical evidence |

The risk score ranks each stock against the other NIFTY 50 constituents. A lower score means lower measured risk relative to this universe, not zero risk.

## Query Engine

The query engine is deterministic and explainable. It:

1. Detects one or two stock names or symbols in the question.
2. Detects whether the user is asking about risk, signals, comparison, or position sizing.
3. Reads only the stored risk and signal values for those stocks.
4. Produces a structured explanation:
   - **What** the current evidence says.
   - **Why** the score looks that way.
   - **How** a person can use the information responsibly.

It does not invent news, fundamentals, target prices, or future returns.

## Data And Price Rules

- Raw `close` is used for the price shown to the user.
- Adjusted close is used for returns and risk calculations so dividends and splits do not create false jumps.
- `price_adjustment_factor = adjusted close / raw close` makes the adjustment explicit.
- Corporate actions are stored separately for review.
- NIFTY 50 is the market benchmark for beta, correlation, and relative performance.
- The live quote endpoint uses Yahoo Finance and may be delayed or temporarily unavailable.

## Validation

The ETL checks:

- required columns;
- duplicate symbol/date keys;
- missing or invalid close values;
- high/low consistency;
- negative volume;
- per-symbol coverage;
- source and fetch timestamps.

Database correctness evidence is in:

- `reports/database_correctness_report.md`
- `data/processed/database_correctness_report.json`
- `data/metadata/data_quality_report.csv`

## Important Limits

- Historical behaviour does not guarantee future behaviour.
- This product does not include valuation, earnings quality, balance-sheet risk, news, options data, or macro forecasts.
- Yahoo Finance intraday history is limited by its free endpoint.
- A stock can have a favourable signal and higher risk at the same time. Signal strength and risk are separate questions.
- The position-size result is an illustration based on user inputs, not personalised financial advice.

## Documentation

The full product, data, analytics, operations, testing, and deployment document is available at [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md).

## Technology

- Python, pandas, SQLite
- Yahoo Finance market data
- Next.js-compatible React application built with vinext
- Cloudflare-compatible edge route for latest quotes
- Git and GitHub for source control

## License And Use

Use the code for learning and portfolio demonstration. Check the terms of every upstream data source before commercial or redistribution use.

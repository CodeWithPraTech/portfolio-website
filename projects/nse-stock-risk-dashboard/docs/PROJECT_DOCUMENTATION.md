# Market Mind Project Documentation

## 1. Executive Summary

Market Mind is a stock-risk intelligence product for people who need a clear view of NIFTY 50 price risk without reading a quantitative report. It converts validated historical price data into a live interactive dashboard and explains every result in ordinary language.

The product answers four business questions:

1. What risk does this stock carry relative to other NIFTY 50 stocks?
2. Why did the dashboard assign that risk and signal score?
3. How has the stock behaved across daily and 30-minute time frames?
4. How can a user translate a loss budget into an illustrative position size?

It is designed as decision support, not an automated trading system.

## 2. Target Users

### Primary

- Individual investors learning risk management.
- Analysts screening NIFTY 50 stocks.
- Portfolio reviewers comparing stock and sector concentration.
- Recruiters or stakeholders assessing an end-to-end analytics project.

### User Needs

- Current data without manually downloading files.
- Consistent comparison across stocks.
- Explanations that define what a number means.
- Evidence behind every label.
- A clear boundary between analysis and advice.

## 3. Product Scope

### Included

- NIFTY 50 constituent universe and NIFTY 50 benchmark.
- Three-year daily OHLCV history.
- Recent 30-minute OHLCV history.
- Dividends and splits.
- Data quality monitoring.
- Price, trend, risk, liquidity, market, sector, and tail-loss analytics.
- Plain-language question answering from measured signals.
- Interactive candlestick charts and position sizing.
- Public web deployment.

### Excluded

- Buy, sell, or target-price recommendations.
- Fundamental valuation or financial statement analysis.
- News and sentiment analysis.
- Derivatives, implied volatility, and options Greeks.
- Broker execution or portfolio account connection.
- Personalised financial advice.

## 4. Data Model

### `symbols`

One row per stock or benchmark. Includes ticker, company name, sector, industry, ISIN, asset type, and activity status.

### `market_prices`

One row per symbol and trading date. Stores raw and adjusted price fields, volume, source, source URL, fetch time, and audit timestamps.

Primary key: `(symbol, trade_date)`.

### `market_intraday_prices`

One row per symbol, 30-minute interval, and interval length. Stores OHLCV plus source and audit metadata.

Primary key: `(symbol, interval_start, interval_minutes)`.

### `corporate_actions`

One row per symbol, action date, and action type. Stores dividends and split terms.

### Operations Tables

- `refresh_runs`: one record for every ETL attempt.
- `refresh_symbol_counts`: rows fetched for each symbol in each run.
- `quality_issues`: validation findings linked to the refresh run.

### Views

- `latest_market_prices`: latest daily row joined to company metadata.
- `latest_intraday_prices`: latest intraday row joined to company metadata.

## 5. ETL Process

### Extract

1. Load the NIFTY 50 universe.
2. Convert NSE symbols to Yahoo Finance tickers.
3. Fetch daily price history and corporate actions.
4. Fetch 30-minute history.
5. Save timestamped raw snapshots.

### Transform

1. Standardise column names and dates.
2. Preserve both raw and adjusted close.
3. Calculate the price adjustment factor.
4. Attach symbol and sector metadata.
5. Enforce numerical types.
6. Run quality checks.

### Load

1. Upsert symbols.
2. Upsert daily rows by symbol and trading date.
3. Upsert intraday rows by symbol and interval.
4. Upsert corporate actions.
5. Record refresh counts and issues.
6. Write clean CSV, manifest, quality report, and dashboard summary.

### Intraday Limitation

Yahoo Finance does not normally return a full year of 30-minute candles through its free chart endpoint. The ETL requests one year, then falls back to the recent supported window and records the warning. Daily data remains the main input for professional risk estimates.

## 6. Analytics

### Returns

Daily return:

```text
adjusted_close_today / adjusted_close_previous_day - 1
```

Adjusted close is used to avoid false gains or losses around splits and dividends.

### Volatility

The sample standard deviation of the latest 60 daily returns, multiplied by the square root of 252 and shown as a percentage.

### Drawdown

At each date:

```text
adjusted_close / highest_adjusted_close_so_far - 1
```

Maximum drawdown is the lowest value in the selected history.

### Beta

```text
covariance(stock_returns, NIFTY_returns) / variance(NIFTY_returns)
```

The latest matching 252 trading days are used when available.

### Correlation

Pearson correlation between stock and NIFTY daily returns over matching dates.

### Historical Tail Loss

- 95% bad-day estimate: absolute value of the fifth percentile daily return.
- Expected shortfall: average loss among returns at or below that threshold.

### ATR

Average true range over 14 observations, considering the day's high-low range and overnight gaps.

### Relative Risk Score

Each stock is ranked from low to high within the current NIFTY 50 universe on:

- volatility;
- one-year drawdown;
- absolute beta;
- 95% historical bad-day loss;
- inverse trading liquidity.

The average percentile rank becomes the 0–100 relative risk score:

- `0–33`: Lower
- `34–66`: Moderate
- `67–100`: Higher

### Signal Score

The 0–100 signal score combines:

- price above its 50-day average;
- 50-day average above its 200-day average;
- positive one-month return;
- positive three-month return;
- three-month performance above NIFTY 50;
- a buffer that decreases as measured risk rises.

Labels:

- `65–100`: Favorable
- `45–64`: Watch
- `0–44`: Caution

The signal is descriptive. It does not estimate a probability of profit.

## 7. Query Decision Engine

The browser-based engine uses the same payload shown in the dashboard.

### Input Processing

1. Convert the question to lower case.
2. match stock symbols and company-name tokens.
3. Detect comparison, risk, signal, or position-size language.
4. Use the currently selected stock when no stock is named.

### Response Structure

- **What**: the risk or signal interpretation.
- **Why**: measured volatility, drawdown, beta, trend, and relative performance.
- **How to use it**: responsible next steps and limits.

### Guardrails

- No invented data.
- No claims about news or fundamentals.
- No future return forecast.
- No buy or sell wording.
- A disclaimer remains visible.

## 8. Position Sizing

User inputs:

- portfolio value;
- maximum percentage loss per idea.

Calculation:

```text
risk_amount = portfolio_value × risk_percentage
stop_distance = 2 × ATR(14)
shares_by_risk = floor(risk_amount / stop_distance)
shares_by_capital = floor((portfolio_value × 20%) / latest_price)
illustrative_shares = min(shares_by_risk, shares_by_capital)
```

The 20% capital cap prevents one result from using most of the portfolio. This remains an educational illustration.

## 9. Web Application

### Production Surface

`web/` is a Next-compatible React application built with vinext for a Cloudflare Worker-compatible deployment.

### Static Analytics

`src.analytics.build_dashboard_payload` converts SQLite data into:

```text
web/public/data/dashboard.json
```

This makes browsing and chart interaction fast and keeps the deployment independent of a Python runtime.

### Latest Quote

`GET /api/live?symbol=RELIANCE` requests a recent daily quote from Yahoo Finance. The response is treated as potentially delayed and does not alter stored risk metrics.

## 10. Testing Strategy

### Data

- row and symbol counts;
- coverage range;
- duplicate-key checks;
- OHLC consistency;
- missing values;
- volume validity;
- corporate-action audit;
- raw versus adjusted price review.

### Analytics

- metric presence for all stocks;
- score range from 0 to 100;
- valid risk and signal labels;
- candle arrays for daily and intraday views;
- sector membership totals.

### Web

- production build;
- server-rendered dashboard title and shell;
- desktop and mobile browser checks;
- stock selection;
- chart window and interval switching;
- query examples;
- sector navigation;
- position-size input;
- live quote fallback.

## 11. Operations

### Normal Daily Refresh

```powershell
python -m src.pipeline.run_etl --lookback 3y
python -m src.pipeline.run_intraday_etl --days 365
python -m src.analytics.build_dashboard_payload
```

### Failure Behaviour

- Daily ETL retries transient Yahoo errors.
- Existing database rows are used when a symbol fetch fails.
- Intraday requests fall back to the supported Yahoo window.
- Fetch warnings and errors are recorded in metadata.
- The dashboard continues to use its last validated analytics payload if a live quote fails.

## 12. Security And Privacy

- The application does not collect personal information.
- Portfolio value and risk percentage stay in browser memory and are not stored.
- There is no login, broker connection, or trade execution.
- No secret or API key is required for the public dashboard.

## 13. Future Improvements

- Scheduled deployment after each successful data refresh.
- Fundamental and earnings-risk module.
- Portfolio upload and correlation matrix.
- Scenario stress tests.
- Longer intraday history from a licensed market-data provider.
- Backtested signal stability and calibration reports.
- Accessibility review with assistive-technology testing.

## 14. Definition Of Done

The project is complete when:

- the database is validated;
- risk features exist for all stocks;
- the dashboard loads from generated analytics;
- daily and 30-minute charts work;
- queries produce What/Why/How explanations;
- sector and position-size views work;
- documentation matches implementation;
- the production build and browser checks pass;
- source is pushed to GitHub;
- a public deployment URL is available.

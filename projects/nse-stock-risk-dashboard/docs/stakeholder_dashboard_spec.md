# Stakeholder Dashboard Spec

## Stakeholder Question

Before I take a position in an NSE stock, what is the risk, how much capital should I expose, and should I buy, avoid, watch, or reduce risk?

## Dashboard Modules

## 1. Data Health

Shows:

- Latest data date
- Symbols available
- Row count
- Quality issue count
- Source/fallback note

Purpose:

The stakeholder knows whether the dashboard is using fresh and validated data.

## 2. Stock List

Shows:

- Symbol
- Latest data date
- Row count
- Source
- Feature availability

Click behavior:

Clicking a stock should open the stock detail view.

## 3. Stock Detail

Completed features:

- Candlestick chart from OHLC data
- Volume bars
- MA20 and MA50 moving averages
- Latest close, one-day move, 90-session move, and volume-vs-average context

Planned features:

- Daily returns
- Rolling volatility
- Drawdown
- Benchmark comparison vs NIFTY50

## 4. Position Sizing

User inputs:

- Total capital
- Risk per trade percent
- Entry price
- Stop-loss price
- Target price

Outputs:

- Capital at risk
- Risk per share
- Suggested quantity
- Potential loss
- Potential reward
- Risk-reward ratio

## 5. Decision Engine

Decision labels:

- Avoid
- Watchlist
- Small Position
- Normal Position
- Reduce Risk

Example logic:

```text
If risk-reward < 1.5:
  Avoid

If risk-reward >= 2 and volatility controlled and trend positive:
  Normal Position

If risk-reward acceptable but volatility/beta/drawdown elevated:
  Small Position
```

## 6. Explainability

Every decision must show reasons:

- Risk-reward status
- Volatility status
- Drawdown status
- Trend status
- Liquidity/volume status

## Next Feature Unlocks

1. Rolling volatility.
2. Drawdown and max drawdown.
3. Position sizing calculator.
4. Decision label engine.
5. Stakeholder summary cards.

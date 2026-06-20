# Data Card

## Dataset

NSE stock and NIFTY50 daily OHLCV market data.

## Current Files

- Raw data: `data/raw/`
- Clean data: `data/clean/stock_prices.csv`
- Metadata: `data/metadata/`
- Processed features: `data/processed/`

## Current Universe

- RELIANCE
- TCS
- HDFCBANK
- INFY
- ICICIBANK
- NIFTY50

## Source Note

Official NSE pages remain the source-of-truth reference. The current reproducible pipeline uses Yahoo Finance as an automated real-data fallback.

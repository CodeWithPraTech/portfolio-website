# Database Correctness Report

Generated: `2026-07-06T08:50:45.863443+00:00`
Status: **PASS**

## Source Files

- Clean prices: `C:\Users\lapto\OneDrive\Documents\Portfolio Website\projects\nse-stock-risk-dashboard\data\clean\stock_prices.csv`
- Nifty 50 constituents: `C:\Users\lapto\OneDrive\Documents\Portfolio Website\projects\nse-stock-risk-dashboard\data\metadata\nifty50_constituents.csv`
- Database: `C:\Users\lapto\OneDrive\Documents\Portfolio Website\projects\nse-stock-risk-dashboard\data\database\market_data.db`

## Shape

- Clean CSV rows: `12694`
- Database rows: `12694`
- Symbols: `51`
- Date range: `2025-07-07` to `2026-07-06`
- Corporate actions: `81`

## Checks

| Check | Result | Detail |
| --- | --- | --- |
| `clean_csv_exists` | PASS | C:\Users\lapto\OneDrive\Documents\Portfolio Website\projects\nse-stock-risk-dashboard\data\clean\stock_prices.csv |
| `constituent_csv_exists` | PASS | C:\Users\lapto\OneDrive\Documents\Portfolio Website\projects\nse-stock-risk-dashboard\data\metadata\nifty50_constituents.csv |
| `db_exists` | PASS | C:\Users\lapto\OneDrive\Documents\Portfolio Website\projects\nse-stock-risk-dashboard\data\database\market_data.db |
| `row_count_matches_clean_csv` | PASS | csv=12694, db=12694 |
| `symbol_count_is_51` | PASS | symbols=51 |
| `nifty_stock_count_is_50` | PASS | constituents=50 |
| `quality_issue_count_zero` | PASS | quality_issues=0 |
| `corporate_actions_present` | PASS | corporate_actions=81 |
| `no_missing_db_keys_vs_clean_csv` | PASS | missing=0 |
| `no_extra_db_keys_vs_clean_csv` | PASS | extra=0 |
| `price_values_match_clean_csv` | PASS | mismatched_rows=0 |
| `all_constituents_seeded_in_symbols` | PASS | missing=0 |
| `symbol_metadata_has_sector_and_isin` | PASS | missing=0 |
| `no_duplicate_symbol_date_in_db` | PASS | duplicates=0 |
| `no_invalid_ohlc_in_db` | PASS | invalid_ohlc=0 |

## Value Comparison

- Compared rows: `12694`
- Mismatched rows: `0`
- Max absolute differences: `{'Open': 2.2737367544323206e-13, 'High': 2.2737367544323206e-13, 'Low': 2.2737367544323206e-13, 'Close': 2.2737367544323206e-13, 'Adj Close': 2.2737367544323206e-13, 'Price Adjustment Factor': 1.1102230246251565e-16, 'Volume': 0.0}`

## Conclusion

The SQLite database matches the clean ETL output and the Nifty 50 constituent source for the validation checks above.
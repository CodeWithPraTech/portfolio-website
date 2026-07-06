PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS symbols (
  symbol TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  sector TEXT,
  industry TEXT,
  nifty_sector_index TEXT,
  series TEXT,
  isin TEXT,
  asset_type TEXT NOT NULL DEFAULT 'stock',
  exchange TEXT NOT NULL DEFAULT 'NSE',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS market_prices (
  symbol TEXT NOT NULL,
  trade_date TEXT NOT NULL,
  ticker TEXT NOT NULL,
  open REAL,
  high REAL,
  low REAL,
  close REAL NOT NULL,
  adj_close REAL,
  price_adjustment_factor REAL,
  volume INTEGER,
  source TEXT NOT NULL,
  source_url TEXT,
  fetch_timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (symbol, trade_date),
  FOREIGN KEY (symbol) REFERENCES symbols(symbol)
);

CREATE INDEX IF NOT EXISTS idx_market_prices_trade_date ON market_prices(trade_date);
CREATE INDEX IF NOT EXISTS idx_market_prices_symbol_date ON market_prices(symbol, trade_date);

CREATE TABLE IF NOT EXISTS corporate_actions (
  symbol TEXT NOT NULL,
  action_date TEXT NOT NULL,
  action_type TEXT NOT NULL,
  dividend_amount REAL,
  split_numerator REAL,
  split_denominator REAL,
  split_ratio TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  fetch_timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (symbol, action_date, action_type),
  FOREIGN KEY (symbol) REFERENCES symbols(symbol)
);

CREATE INDEX IF NOT EXISTS idx_corporate_actions_symbol_date ON corporate_actions(symbol, action_date);
CREATE INDEX IF NOT EXISTS idx_corporate_actions_type ON corporate_actions(action_type);

CREATE TABLE IF NOT EXISTS market_intraday_prices (
  symbol TEXT NOT NULL,
  interval_start TEXT NOT NULL,
  interval_end TEXT,
  interval_minutes INTEGER NOT NULL DEFAULT 30,
  ticker TEXT NOT NULL,
  open REAL,
  high REAL,
  low REAL,
  close REAL NOT NULL,
  volume INTEGER,
  source TEXT NOT NULL,
  source_url TEXT,
  fetch_timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (symbol, interval_start, interval_minutes),
  FOREIGN KEY (symbol) REFERENCES symbols(symbol)
);

CREATE INDEX IF NOT EXISTS idx_intraday_symbol_start ON market_intraday_prices(symbol, interval_start);
CREATE INDEX IF NOT EXISTS idx_intraday_interval_start ON market_intraday_prices(interval_start);

CREATE TABLE IF NOT EXISTS refresh_runs (
  run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  lookback TEXT NOT NULL,
  window_start TEXT NOT NULL,
  window_end TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  status TEXT NOT NULL,
  rows_fetched INTEGER NOT NULL DEFAULT 0,
  rows_upserted INTEGER NOT NULL DEFAULT 0,
  quality_issue_count INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

CREATE TABLE IF NOT EXISTS refresh_symbol_counts (
  run_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  rows_fetched INTEGER NOT NULL DEFAULT 0,
  latest_trade_date TEXT,
  PRIMARY KEY (run_id, symbol),
  FOREIGN KEY (run_id) REFERENCES refresh_runs(run_id),
  FOREIGN KEY (symbol) REFERENCES symbols(symbol)
);

CREATE TABLE IF NOT EXISTS quality_issues (
  issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER,
  symbol TEXT,
  trade_date TEXT,
  issue TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES refresh_runs(run_id)
);

CREATE VIEW IF NOT EXISTS latest_market_prices AS
SELECT
  mp.*,
  s.name,
  s.sector,
  s.industry,
  s.nifty_sector_index,
  s.asset_type
FROM market_prices mp
JOIN symbols s
  ON mp.symbol = s.symbol
JOIN (
  SELECT symbol, MAX(trade_date) AS latest_trade_date
  FROM market_prices
  GROUP BY symbol
) latest
  ON mp.symbol = latest.symbol
 AND mp.trade_date = latest.latest_trade_date;

CREATE VIEW IF NOT EXISTS latest_intraday_prices AS
SELECT
  mip.*,
  s.name,
  s.sector,
  s.industry,
  s.nifty_sector_index,
  s.asset_type
FROM market_intraday_prices mip
JOIN symbols s
  ON mip.symbol = s.symbol
JOIN (
  SELECT symbol, interval_minutes, MAX(interval_start) AS latest_interval_start
  FROM market_intraday_prices
  GROUP BY symbol, interval_minutes
) latest
  ON mip.symbol = latest.symbol
 AND mip.interval_minutes = latest.interval_minutes
 AND mip.interval_start = latest.latest_interval_start;

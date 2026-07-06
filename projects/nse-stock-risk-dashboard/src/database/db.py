"""SQLite database access for market data."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from src.config import DATABASE_PATH, SYMBOL_NAMES, SYMBOL_SECTORS, SYMBOLS


SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def connect(db_path: Path = DATABASE_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_database(connection: sqlite3.Connection | None = None) -> None:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        connection.execute("DROP VIEW IF EXISTS latest_market_prices")
        connection.execute("DROP VIEW IF EXISTS latest_intraday_prices")
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        migrate_symbols_table(connection)
        seed_symbols(connection)
        connection.commit()
    finally:
        if owns_connection:
            connection.close()


def seed_symbols(connection: sqlite3.Connection) -> None:
    now = utc_now()
    for symbol, ticker in SYMBOLS.items():
        asset_type = "benchmark" if symbol == "NIFTY50" else "stock"
        sector_info = SYMBOL_SECTORS[symbol]
        connection.execute(
            """
            INSERT INTO symbols (
              symbol, ticker, name, sector, industry, nifty_sector_index,
              series, isin, asset_type, exchange, is_active, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NSE', 1, ?, ?)
            ON CONFLICT(symbol) DO UPDATE SET
              ticker = excluded.ticker,
              name = excluded.name,
              sector = excluded.sector,
              industry = excluded.industry,
              nifty_sector_index = excluded.nifty_sector_index,
              series = excluded.series,
              isin = excluded.isin,
              asset_type = excluded.asset_type,
              is_active = excluded.is_active,
              updated_at = excluded.updated_at
            """,
            (
                symbol,
                ticker,
                SYMBOL_NAMES[symbol],
                sector_info["sector"],
                sector_info["industry"],
                sector_info["nifty_sector_index"],
                sector_info.get("series"),
                sector_info.get("isin"),
                asset_type,
                now,
                now,
            ),
        )


def migrate_symbols_table(connection: sqlite3.Connection) -> None:
    existing_columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(symbols)").fetchall()
    }
    migrations = {
        "sector": "ALTER TABLE symbols ADD COLUMN sector TEXT",
        "industry": "ALTER TABLE symbols ADD COLUMN industry TEXT",
        "nifty_sector_index": "ALTER TABLE symbols ADD COLUMN nifty_sector_index TEXT",
        "series": "ALTER TABLE symbols ADD COLUMN series TEXT",
        "isin": "ALTER TABLE symbols ADD COLUMN isin TEXT",
    }
    for column, statement in migrations.items():
        if column not in existing_columns:
            connection.execute(statement)

    price_columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(market_prices)").fetchall()
    }
    if "price_adjustment_factor" not in price_columns:
        connection.execute("ALTER TABLE market_prices ADD COLUMN price_adjustment_factor REAL")


def begin_refresh_run(connection: sqlite3.Connection, lookback: str, window_start: str, window_end: str, started_at: str) -> int:
    cursor = connection.execute(
        """
        INSERT INTO refresh_runs (lookback, window_start, window_end, started_at, finished_at, status)
        VALUES (?, ?, ?, ?, ?, 'running')
        """,
        (lookback, window_start, window_end, started_at, started_at),
    )
    connection.commit()
    return int(cursor.lastrowid)


def upsert_market_rows(connection: sqlite3.Connection, rows: list[dict]) -> int:
    now = utc_now()
    payload = [
        (
            row["Symbol"],
            row["Date"],
            row["Ticker"],
            as_float(row["Open"]),
            as_float(row["High"]),
            as_float(row["Low"]),
            as_float(row["Close"]),
            as_float(row["Adj Close"]),
            as_float(row.get("Price Adjustment Factor")),
            as_int(row["Volume"]),
            row["Source"],
            row["Source URL"],
            row["Fetch Timestamp"],
            now,
            now,
        )
        for row in rows
    ]
    connection.executemany(
        """
        INSERT INTO market_prices (
          symbol, trade_date, ticker, open, high, low, close, adj_close,
          price_adjustment_factor, volume,
          source, source_url, fetch_timestamp, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol, trade_date) DO UPDATE SET
          ticker = excluded.ticker,
          open = excluded.open,
          high = excluded.high,
          low = excluded.low,
          close = excluded.close,
          adj_close = excluded.adj_close,
          price_adjustment_factor = excluded.price_adjustment_factor,
          volume = excluded.volume,
          source = excluded.source,
          source_url = excluded.source_url,
          fetch_timestamp = excluded.fetch_timestamp,
          updated_at = excluded.updated_at
        """,
        payload,
    )
    return len(payload)


def upsert_corporate_actions(connection: sqlite3.Connection, actions: list[dict]) -> int:
    now = utc_now()
    payload = [
        (
            action["Symbol"],
            action["Action Date"],
            action["Action Type"],
            as_float(action.get("Dividend Amount")),
            as_float(action.get("Split Numerator")),
            as_float(action.get("Split Denominator")),
            action.get("Split Ratio"),
            action["Source"],
            action["Source URL"],
            action["Fetch Timestamp"],
            now,
            now,
        )
        for action in actions
    ]
    connection.executemany(
        """
        INSERT INTO corporate_actions (
          symbol, action_date, action_type, dividend_amount, split_numerator,
          split_denominator, split_ratio, source, source_url, fetch_timestamp,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol, action_date, action_type) DO UPDATE SET
          dividend_amount = excluded.dividend_amount,
          split_numerator = excluded.split_numerator,
          split_denominator = excluded.split_denominator,
          split_ratio = excluded.split_ratio,
          source = excluded.source,
          source_url = excluded.source_url,
          fetch_timestamp = excluded.fetch_timestamp,
          updated_at = excluded.updated_at
        """,
        payload,
    )
    return len(payload)


def upsert_intraday_rows(connection: sqlite3.Connection, rows: list[dict]) -> int:
    now = utc_now()
    payload = [
        (
            row["Symbol"],
            row["Interval Start"],
            row["Interval End"],
            as_int(row["Interval Minutes"]),
            row["Ticker"],
            as_float(row["Open"]),
            as_float(row["High"]),
            as_float(row["Low"]),
            as_float(row["Close"]),
            as_int(row["Volume"]),
            row["Source"],
            row["Source URL"],
            row["Fetch Timestamp"],
            now,
            now,
        )
        for row in rows
    ]
    connection.executemany(
        """
        INSERT INTO market_intraday_prices (
          symbol, interval_start, interval_end, interval_minutes, ticker,
          open, high, low, close, volume, source, source_url,
          fetch_timestamp, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol, interval_start, interval_minutes) DO UPDATE SET
          interval_end = excluded.interval_end,
          ticker = excluded.ticker,
          open = excluded.open,
          high = excluded.high,
          low = excluded.low,
          close = excluded.close,
          volume = excluded.volume,
          source = excluded.source,
          source_url = excluded.source_url,
          fetch_timestamp = excluded.fetch_timestamp,
          updated_at = excluded.updated_at
        """,
        payload,
    )
    return len(payload)


def replace_quality_issues(connection: sqlite3.Connection, run_id: int, issues: list[list[str]]) -> None:
    now = utc_now()
    connection.execute("DELETE FROM quality_issues WHERE run_id = ?", (run_id,))
    connection.executemany(
        """
        INSERT INTO quality_issues (run_id, symbol, trade_date, issue, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        [(run_id, symbol, trade_date, issue, now) for symbol, trade_date, issue in issues],
    )


def write_symbol_counts(connection: sqlite3.Connection, run_id: int, rows_by_symbol: dict[str, list[dict]]) -> None:
    connection.execute("DELETE FROM refresh_symbol_counts WHERE run_id = ?", (run_id,))
    payload = []
    for symbol in SYMBOLS:
        rows = rows_by_symbol.get(symbol, [])
        latest_trade_date = max((row["Date"] for row in rows), default=None)
        payload.append((run_id, symbol, len(rows), latest_trade_date))
    connection.executemany(
        """
        INSERT INTO refresh_symbol_counts (run_id, symbol, rows_fetched, latest_trade_date)
        VALUES (?, ?, ?, ?)
        """,
        payload,
    )


def finish_refresh_run(
    connection: sqlite3.Connection,
    run_id: int,
    status: str,
    finished_at: str,
    rows_fetched: int,
    rows_upserted: int,
    quality_issue_count: int,
    message: str | None = None,
) -> None:
    connection.execute(
        """
        UPDATE refresh_runs
        SET finished_at = ?, status = ?, rows_fetched = ?, rows_upserted = ?,
            quality_issue_count = ?, message = ?
        WHERE run_id = ?
        """,
        (finished_at, status, rows_fetched, rows_upserted, quality_issue_count, message, run_id),
    )
    connection.commit()


def database_counts(connection: sqlite3.Connection) -> dict:
    prices = connection.execute("SELECT COUNT(*) AS count FROM market_prices").fetchone()["count"]
    intraday_prices = connection.execute("SELECT COUNT(*) AS count FROM market_intraday_prices").fetchone()["count"]
    corporate_actions = connection.execute("SELECT COUNT(*) AS count FROM corporate_actions").fetchone()["count"]
    symbols = connection.execute("SELECT COUNT(*) AS count FROM symbols").fetchone()["count"]
    latest_date = connection.execute("SELECT MAX(trade_date) AS latest_date FROM market_prices").fetchone()["latest_date"]
    latest_intraday = connection.execute("SELECT MAX(interval_start) AS latest_interval FROM market_intraday_prices").fetchone()["latest_interval"]
    return {
        "databasePath": str(DATABASE_PATH),
        "databaseRows": prices,
        "databaseIntradayRows": intraday_prices,
        "databaseCorporateActions": corporate_actions,
        "databaseSymbols": symbols,
        "databaseLatestDate": latest_date,
        "databaseLatestIntraday": latest_intraday,
    }


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def as_float(value) -> float | None:
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None


def as_int(value) -> int | None:
    try:
        return None if value is None else int(value)
    except (TypeError, ValueError):
        return None

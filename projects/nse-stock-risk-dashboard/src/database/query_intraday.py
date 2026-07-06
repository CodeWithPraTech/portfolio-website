"""Return recent 30-minute candles as JSON."""

from __future__ import annotations

import argparse
import json

from src.database.db import connect, init_database


def main() -> None:
    args = parse_args()
    print(json.dumps(query_intraday(args.symbol, args.limit), indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Query recent 30-minute candles.")
    parser.add_argument("--symbol", default="RELIANCE")
    parser.add_argument("--limit", type=int, default=80)
    return parser.parse_args()


def query_intraday(symbol: str, limit: int = 80) -> dict:
    connection = connect()
    try:
        init_database(connection)
        symbol = symbol.upper()
        rows = [
            dict(row)
            for row in connection.execute(
                """
                SELECT
                  mip.symbol,
                  s.name,
                  s.sector,
                  s.industry,
                  mip.interval_start,
                  mip.interval_end,
                  mip.interval_minutes,
                  mip.open,
                  mip.high,
                  mip.low,
                  mip.close,
                  mip.volume,
                  mip.source,
                  mip.fetch_timestamp
                FROM market_intraday_prices mip
                JOIN symbols s
                  ON s.symbol = mip.symbol
                WHERE mip.symbol = ?
                  AND mip.interval_minutes = 30
                ORDER BY mip.interval_start DESC
                LIMIT ?
                """,
                (symbol, limit),
            ).fetchall()
        ]
        rows.reverse()
        return {
            "status": "ok",
            "symbol": symbol,
            "interval": "30m",
            "rows": len(rows),
            "candles": rows,
        }
    finally:
        connection.close()


if __name__ == "__main__":
    main()

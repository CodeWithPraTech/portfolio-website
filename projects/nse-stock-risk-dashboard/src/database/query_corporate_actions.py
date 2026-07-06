"""Return stored corporate actions as JSON."""

from __future__ import annotations

import argparse
import json

from src.database.db import connect, init_database


def main() -> None:
    args = parse_args()
    print(json.dumps(query_corporate_actions(args.symbol, args.limit), indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Query corporate actions.")
    parser.add_argument("--symbol", default="ALL")
    parser.add_argument("--limit", type=int, default=100)
    return parser.parse_args()


def query_corporate_actions(symbol: str = "ALL", limit: int = 100) -> dict:
    connection = connect()
    try:
        init_database(connection)
        params = []
        where = ""
        symbol = symbol.upper()
        if symbol != "ALL":
            where = "WHERE ca.symbol = ?"
            params.append(symbol)
        params.append(limit)
        rows = [
            dict(row)
            for row in connection.execute(
                f"""
                SELECT
                  ca.symbol,
                  s.name,
                  s.sector,
                  ca.action_date,
                  ca.action_type,
                  ca.dividend_amount,
                  ca.split_numerator,
                  ca.split_denominator,
                  ca.split_ratio,
                  ca.source,
                  ca.fetch_timestamp
                FROM corporate_actions ca
                JOIN symbols s
                  ON s.symbol = ca.symbol
                {where}
                ORDER BY ca.action_date DESC, ca.symbol
                LIMIT ?
                """,
                params,
            ).fetchall()
        ]
        return {
            "status": "ok",
            "symbol": symbol,
            "rows": len(rows),
            "corporateActions": rows,
        }
    finally:
        connection.close()


if __name__ == "__main__":
    main()

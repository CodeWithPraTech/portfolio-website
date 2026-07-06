"""Print a compact database status report."""

from src.database.db import connect, database_counts, init_database


def main() -> None:
    connection = connect()
    try:
        init_database(connection)
        counts = database_counts(connection)
        latest_run = connection.execute(
            """
            SELECT run_id, lookback, window_start, window_end, finished_at, status,
                   rows_fetched, rows_upserted, quality_issue_count
            FROM refresh_runs
            ORDER BY run_id DESC
            LIMIT 1
            """
        ).fetchone()
        print(counts)
        if latest_run:
            print(dict(latest_run))
    finally:
        connection.close()


if __name__ == "__main__":
    main()

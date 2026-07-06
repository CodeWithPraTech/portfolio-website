"""Create or update the SQLite database schema."""

from src.config import DATABASE_PATH
from src.database.db import init_database


def main() -> None:
    init_database()
    print(f"Database ready: {DATABASE_PATH}")


if __name__ == "__main__":
    main()

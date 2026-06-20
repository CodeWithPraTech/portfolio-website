"""Fetch NSE stock market data.

Canonical implementation currently lives in the portfolio-level tools folder.
This module is the project-owned entry point that will absorb that logic.
"""

from pathlib import Path
import runpy


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PORTFOLIO_ROOT = PROJECT_ROOT.parents[1]
LEGACY_SCRIPT = PORTFOLIO_ROOT / "tools" / "fetch_stock_market_data.py"


def main() -> None:
    """Run the current market-data fetcher."""
    if not LEGACY_SCRIPT.exists():
      raise FileNotFoundError(f"Fetcher not found: {LEGACY_SCRIPT}")
    runpy.run_path(str(LEGACY_SCRIPT), run_name="__main__")


if __name__ == "__main__":
    main()

"""Shared project configuration."""

import csv
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = PROJECT_ROOT / "data"
RAW_DIR = DATA_ROOT / "raw" / "yahoo_finance"
CLEAN_DIR = DATA_ROOT / "clean"
PROCESSED_DIR = DATA_ROOT / "processed"
METADATA_DIR = DATA_ROOT / "metadata"
DATABASE_DIR = DATA_ROOT / "database"

CLEAN_PRICES_PATH = CLEAN_DIR / "stock_prices.csv"
DASHBOARD_SUMMARY_PATH = PROCESSED_DIR / "dashboard_summary.json"
MANIFEST_PATH = METADATA_DIR / "ingestion_manifest.json"
QUALITY_REPORT_PATH = METADATA_DIR / "data_quality_report.csv"
DATABASE_PATH = DATABASE_DIR / "market_data.db"
NIFTY50_CONSTITUENTS_PATH = METADATA_DIR / "nifty50_constituents.csv"


def load_nifty50_universe() -> list[dict]:
    if not NIFTY50_CONSTITUENTS_PATH.exists():
        return fallback_universe()

    with NIFTY50_CONSTITUENTS_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    universe = []
    for row in rows:
        symbol = row["Symbol"].strip()
        company_name = row["Company Name"].strip()
        industry = row["Industry"].strip()
        universe.append({
            "symbol": symbol,
            "ticker": f"{symbol}.NS",
            "name": company_name,
            "sector": industry,
            "industry": industry,
            "nifty_sector_index": sector_index_for(industry),
            "asset_type": "stock",
            "series": row.get("Series", "").strip(),
            "isin": row.get("ISIN Code", "").strip(),
        })

    universe.append(benchmark_row())
    return universe


def fallback_universe() -> list[dict]:
    return [
        {"symbol": "RELIANCE", "ticker": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Oil, Gas & Consumable Fuels", "industry": "Oil, Gas & Consumable Fuels", "nifty_sector_index": "NIFTY Oil & Gas", "asset_type": "stock", "series": "EQ", "isin": ""},
        {"symbol": "TCS", "ticker": "TCS.NS", "name": "Tata Consultancy Services", "sector": "Information Technology", "industry": "Information Technology", "nifty_sector_index": "NIFTY IT", "asset_type": "stock", "series": "EQ", "isin": ""},
        {"symbol": "HDFCBANK", "ticker": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Financial Services", "industry": "Financial Services", "nifty_sector_index": "NIFTY Bank", "asset_type": "stock", "series": "EQ", "isin": ""},
        {"symbol": "INFY", "ticker": "INFY.NS", "name": "Infosys", "sector": "Information Technology", "industry": "Information Technology", "nifty_sector_index": "NIFTY IT", "asset_type": "stock", "series": "EQ", "isin": ""},
        {"symbol": "ICICIBANK", "ticker": "ICICIBANK.NS", "name": "ICICI Bank", "sector": "Financial Services", "industry": "Financial Services", "nifty_sector_index": "NIFTY Bank", "asset_type": "stock", "series": "EQ", "isin": ""},
        benchmark_row(),
    ]


def benchmark_row() -> dict:
    return {
        "symbol": "NIFTY50",
        "ticker": "^NSEI",
        "name": "NIFTY 50 Benchmark",
        "sector": "Broad Market Index",
        "industry": "Benchmark Index",
        "nifty_sector_index": "NIFTY 50",
        "asset_type": "benchmark",
        "series": "INDEX",
        "isin": "",
    }


def sector_index_for(industry: str) -> str:
    mapping = {
        "Financial Services": "NIFTY Financial Services",
        "Information Technology": "NIFTY IT",
        "Oil, Gas & Consumable Fuels": "NIFTY Oil & Gas",
        "Healthcare": "NIFTY Healthcare",
        "Fast Moving Consumer Goods": "NIFTY FMCG",
        "Automobile and Auto Components": "NIFTY Auto",
        "Metals & Mining": "NIFTY Metal",
        "Consumer Durables": "NIFTY Consumer Durables",
        "Consumer Services": "NIFTY Consumer Services",
        "Construction Materials": "NIFTY Infrastructure",
        "Construction": "NIFTY Infrastructure",
        "Power": "NIFTY Energy",
        "Telecommunication": "NIFTY India Digital",
        "Capital Goods": "NIFTY Capital Markets",
        "Services": "NIFTY Services Sector",
    }
    return mapping.get(industry, "NIFTY 50")


NIFTY50_UNIVERSE = load_nifty50_universe()
SYMBOLS = {row["symbol"]: row["ticker"] for row in NIFTY50_UNIVERSE}
SYMBOL_NAMES = {row["symbol"]: row["name"] for row in NIFTY50_UNIVERSE}
SYMBOL_SECTORS = {
    row["symbol"]: {
        "sector": row["sector"],
        "industry": row["industry"],
        "nifty_sector_index": row["nifty_sector_index"],
        "asset_type": row["asset_type"],
        "series": row["series"],
        "isin": row["isin"],
    }
    for row in NIFTY50_UNIVERSE
}

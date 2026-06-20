"""Append and deduplicate OHLCV rows."""

from pathlib import Path
import pandas as pd


def append_market_data(existing_path: Path, new_path: Path, output_path: Path) -> pd.DataFrame:
    existing = pd.read_csv(existing_path) if existing_path.exists() else pd.DataFrame()
    incoming = pd.read_csv(new_path)
    combined = pd.concat([existing, incoming], ignore_index=True)
    combined = combined.drop_duplicates(subset=["Symbol", "Date"], keep="last")
    combined = combined.sort_values(["Symbol", "Date"]).reset_index(drop=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(output_path, index=False)
    return combined

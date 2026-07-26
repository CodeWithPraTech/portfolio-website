"""Build the compact, deployable analytics payload used by the web dashboard."""

from __future__ import annotations

import argparse
import json
import math
import sqlite3
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE = PROJECT_ROOT / "data" / "database" / "market_data.db"
DEFAULT_OUTPUT = PROJECT_ROOT / "web" / "public" / "data" / "dashboard.json"
TRADING_DAYS = 252


def safe_round(value, digits=2):
    if value is None or not math.isfinite(value):
        return None
    return round(value, digits)


def change(values, periods):
    if len(values) <= periods or not values[-periods - 1]:
        return None
    return (values[-1] / values[-periods - 1] - 1) * 100


def mean(values):
    cleaned = [value for value in values if value is not None]
    return statistics.fmean(cleaned) if cleaned else None


def percentile(values, probability):
    cleaned = sorted(value for value in values if value is not None)
    if not cleaned:
        return None
    position = (len(cleaned) - 1) * probability
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return cleaned[lower]
    return cleaned[lower] + (cleaned[upper] - cleaned[lower]) * (position - lower)


def pct_returns(rows):
    returns = {}
    previous = None
    for row in rows:
        price = row["adj_close"] or row["close"]
        if previous and price:
            returns[row["trade_date"]] = price / previous - 1
        previous = price
    return returns


def calculate_drawdown(prices):
    peak = None
    worst = 0.0
    current = 0.0
    for price in prices:
        peak = price if peak is None else max(peak, price)
        current = price / peak - 1 if peak else 0.0
        worst = min(worst, current)
    return worst * 100, current * 100


def calculate_atr(rows, window=14):
    ranges = []
    previous_close = None
    for row in rows:
        high = row["high"]
        low = row["low"]
        if high is None or low is None:
            continue
        true_range = high - low
        if previous_close:
            true_range = max(true_range, abs(high - previous_close), abs(low - previous_close))
        ranges.append(true_range)
        previous_close = row["close"]
    return mean(ranges[-window:])


def aligned_beta_and_correlation(stock_returns, benchmark_returns):
    dates = sorted(set(stock_returns).intersection(benchmark_returns))[-TRADING_DAYS:]
    if len(dates) < 30:
        return None, None
    stock = [stock_returns[date] for date in dates]
    benchmark = [benchmark_returns[date] for date in dates]
    benchmark_variance = statistics.variance(benchmark)
    if benchmark_variance == 0:
        return None, None
    covariance = statistics.covariance(stock, benchmark)
    beta = covariance / benchmark_variance
    stock_std = statistics.stdev(stock)
    benchmark_std = statistics.stdev(benchmark)
    correlation = covariance / (stock_std * benchmark_std) if stock_std and benchmark_std else None
    return beta, correlation


def rank_score(items, key, reverse=False):
    usable = sorted(
        ((item["symbol"], item["_raw"].get(key)) for item in items if item["_raw"].get(key) is not None),
        key=lambda pair: pair[1],
        reverse=reverse,
    )
    if not usable:
        return {}
    denominator = max(len(usable) - 1, 1)
    return {symbol: index / denominator * 100 for index, (symbol, _) in enumerate(usable)}


def risk_label(score):
    if score < 34:
        return "Lower"
    if score < 67:
        return "Moderate"
    return "Higher"


def signal_label(score):
    if score >= 65:
        return "Favorable"
    if score >= 45:
        return "Watch"
    return "Caution"


def build_stock_record(symbol_row, rows, benchmark_returns, benchmark_momentum_60):
    prices = [row["adj_close"] or row["close"] for row in rows]
    returns_by_date = pct_returns(rows)
    recent_returns = list(returns_by_date.values())[-TRADING_DAYS:]
    volatility_window = recent_returns[-60:]
    volatility = (
        statistics.stdev(volatility_window) * math.sqrt(TRADING_DAYS) * 100
        if len(volatility_window) >= 20
        else None
    )
    max_drawdown_3y, current_drawdown = calculate_drawdown(prices)
    max_drawdown_1y, _ = calculate_drawdown(prices[-TRADING_DAYS:])
    beta, correlation = aligned_beta_and_correlation(returns_by_date, benchmark_returns)
    var_threshold = percentile(recent_returns, 0.05)
    tail = [value for value in recent_returns if var_threshold is not None and value <= var_threshold]
    value_at_risk = abs(var_threshold) * 100 if var_threshold is not None else None
    expected_shortfall = abs(mean(tail)) * 100 if tail else None
    atr = calculate_atr(rows)
    latest = rows[-1]
    latest_close = latest["close"]
    average_value = mean(
        [(row["close"] or 0) * (row["volume"] or 0) for row in rows[-20:]]
    )
    sma20 = mean(prices[-20:])
    sma50 = mean(prices[-50:])
    sma200 = mean(prices[-200:])

    return {
        "symbol": symbol_row["symbol"],
        "name": symbol_row["name"],
        "sector": symbol_row["sector"] or "Unclassified",
        "industry": symbol_row["industry"] or symbol_row["sector"] or "Unclassified",
        "latestDate": latest["trade_date"],
        "latestClose": safe_round(latest_close),
        "dayChangePct": safe_round(change(prices, 1)),
        "weekChangePct": safe_round(change(prices, 5)),
        "monthChangePct": safe_round(change(prices, 20)),
        "quarterChangePct": safe_round(change(prices, 60)),
        "yearChangePct": safe_round(change(prices, TRADING_DAYS)),
        "volatility": safe_round(volatility),
        "maxDrawdown1y": safe_round(max_drawdown_1y),
        "maxDrawdown3y": safe_round(max_drawdown_3y),
        "currentDrawdown": safe_round(current_drawdown),
        "beta": safe_round(beta),
        "correlation": safe_round(correlation),
        "valueAtRisk95": safe_round(value_at_risk),
        "expectedShortfall95": safe_round(expected_shortfall),
        "atr14": safe_round(atr),
        "atrPct": safe_round(atr / latest_close * 100 if atr and latest_close else None),
        "averageValue20d": safe_round(average_value, 0),
        "volumeRatio": safe_round(
            (latest["volume"] or 0) / mean([row["volume"] for row in rows[-20:]])
            if mean([row["volume"] for row in rows[-20:]])
            else None
        ),
        "sma20": safe_round(sma20),
        "sma50": safe_round(sma50),
        "sma200": safe_round(sma200),
        "dataPoints": len(rows),
        "candles": [
            [
                row["trade_date"],
                safe_round(row["open"]),
                safe_round(row["high"]),
                safe_round(row["low"]),
                safe_round(row["close"]),
                row["volume"],
            ]
            for row in rows
        ],
        "_raw": {
            "volatility": volatility,
            "drawdown": abs(max_drawdown_1y),
            "beta": abs(beta) if beta is not None else None,
            "var": value_at_risk,
            "liquidity": average_value,
            "momentum20": change(prices, 20),
            "momentum60": change(prices, 60),
            "relative60": (change(prices, 60) or 0) - (benchmark_momentum_60 or 0),
            "trend50": latest_close > sma50 if sma50 else False,
            "trend200": sma50 > sma200 if sma50 and sma200 else False,
        },
    }


def add_scores(stocks):
    volatility_ranks = rank_score(stocks, "volatility")
    drawdown_ranks = rank_score(stocks, "drawdown")
    beta_ranks = rank_score(stocks, "beta")
    var_ranks = rank_score(stocks, "var")
    liquidity_ranks = rank_score(stocks, "liquidity", reverse=True)

    for stock in stocks:
        symbol = stock["symbol"]
        risk_score = mean(
            [
                volatility_ranks.get(symbol),
                drawdown_ranks.get(symbol),
                beta_ranks.get(symbol),
                var_ranks.get(symbol),
                liquidity_ranks.get(symbol),
            ]
        ) or 0
        raw = stock["_raw"]
        trend_score = 15 if raw["trend50"] else 0
        trend_score += 15 if raw["trend200"] else 0
        momentum_score = 15 if (raw["momentum20"] or 0) > 0 else 0
        momentum_score += 15 if (raw["momentum60"] or 0) > 0 else 0
        relative_score = 10 if (raw["relative60"] or 0) > 0 else 0
        risk_buffer = 30 - risk_score * 0.3
        signal_score = max(0, min(100, trend_score + momentum_score + relative_score + risk_buffer))
        stock["riskScore"] = safe_round(risk_score, 0)
        stock["riskLevel"] = risk_label(risk_score)
        stock["signalScore"] = safe_round(signal_score, 0)
        stock["signal"] = signal_label(signal_score)
        stock["signals"] = {
            "priceAbove50d": raw["trend50"],
            "fiftyAbove200d": raw["trend200"],
            "positiveMonth": (raw["momentum20"] or 0) > 0,
            "positiveQuarter": (raw["momentum60"] or 0) > 0,
            "beatsMarketQuarter": (raw["relative60"] or 0) > 0,
        }
        del stock["_raw"]


def fetch_intraday(connection):
    rows = connection.execute(
        """
        SELECT symbol, interval_start, open, high, low, close, volume
        FROM market_intraday_prices
        ORDER BY symbol, interval_start
        """
    ).fetchall()
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["symbol"]].append(
            [
                row["interval_start"],
                safe_round(row["open"]),
                safe_round(row["high"]),
                safe_round(row["low"]),
                safe_round(row["close"]),
                row["volume"],
            ]
        )
    return {symbol: candles[-260:] for symbol, candles in grouped.items()}


def fetch_actions(connection):
    rows = connection.execute(
        """
        SELECT symbol, action_date, action_type, dividend_amount, split_ratio
        FROM corporate_actions
        ORDER BY symbol, action_date DESC
        """
    ).fetchall()
    grouped = defaultdict(list)
    for row in rows:
        if len(grouped[row["symbol"]]) >= 8:
            continue
        grouped[row["symbol"]].append(
            {
                "date": row["action_date"],
                "type": row["action_type"],
                "dividend": safe_round(row["dividend_amount"]),
                "splitRatio": row["split_ratio"],
            }
        )
    return grouped


def sector_summary(stocks):
    grouped = defaultdict(list)
    for stock in stocks:
        grouped[stock["sector"]].append(stock)
    sectors = []
    for sector, members in grouped.items():
        sectors.append(
            {
                "sector": sector,
                "stocks": len(members),
                "averageRisk": safe_round(mean([item["riskScore"] for item in members]), 0),
                "averageVolatility": safe_round(mean([item["volatility"] for item in members])),
                "monthChangePct": safe_round(mean([item["monthChangePct"] for item in members])),
            }
        )
    return sorted(sectors, key=lambda item: item["averageRisk"] or 0, reverse=True)


def build_payload(database_path):
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    symbol_rows = connection.execute(
        "SELECT symbol, name, sector, industry FROM symbols WHERE is_active = 1 ORDER BY symbol"
    ).fetchall()
    price_rows = connection.execute(
        """
        SELECT symbol, trade_date, open, high, low, close, adj_close, volume
        FROM market_prices
        ORDER BY symbol, trade_date
        """
    ).fetchall()
    grouped = defaultdict(list)
    for row in price_rows:
        grouped[row["symbol"]].append(row)

    benchmark_rows = grouped["NIFTY50"]
    benchmark_prices = [row["adj_close"] or row["close"] for row in benchmark_rows]
    benchmark_returns = pct_returns(benchmark_rows)
    benchmark_momentum_60 = change(benchmark_prices, 60)
    stocks = [
        build_stock_record(
            symbol,
            grouped[symbol["symbol"]],
            benchmark_returns,
            benchmark_momentum_60,
        )
        for symbol in symbol_rows
        if symbol["symbol"] != "NIFTY50" and grouped[symbol["symbol"]]
    ]
    add_scores(stocks)
    intraday = fetch_intraday(connection)
    actions = fetch_actions(connection)
    for stock in stocks:
        stock["intraday"] = intraday.get(stock["symbol"], [])
        stock["corporateActions"] = actions.get(stock["symbol"], [])

    sectors = sector_summary(stocks)
    latest_date = max(stock["latestDate"] for stock in stocks)
    quality_issues = connection.execute("SELECT COUNT(*) FROM quality_issues").fetchone()[0]
    connection.close()

    return {
        "meta": {
            "name": "Market Mind",
            "universe": "NIFTY 50",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "latestMarketDate": latest_date,
            "dailyRows": len(price_rows),
            "intradayRows": sum(len(values) for values in intraday.values()),
            "stockCount": len(stocks),
            "qualityIssues": quality_issues,
            "dailyRange": [price_rows[0]["trade_date"], latest_date],
            "disclaimer": "Educational risk intelligence, not investment advice.",
        },
        "market": {
            "latestClose": safe_round(benchmark_rows[-1]["close"]),
            "dayChangePct": safe_round(change(benchmark_prices, 1)),
            "monthChangePct": safe_round(change(benchmark_prices, 20)),
            "yearChangePct": safe_round(change(benchmark_prices, TRADING_DAYS)),
            "advancers": sum(1 for stock in stocks if (stock["dayChangePct"] or 0) > 0),
            "decliners": sum(1 for stock in stocks if (stock["dayChangePct"] or 0) < 0),
            "higherRisk": sum(1 for stock in stocks if stock["riskLevel"] == "Higher"),
            "moderateRisk": sum(1 for stock in stocks if stock["riskLevel"] == "Moderate"),
            "lowerRisk": sum(1 for stock in stocks if stock["riskLevel"] == "Lower"),
        },
        "sectors": sectors,
        "stocks": stocks,
    }


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main():
    args = parse_args()
    payload = build_payload(args.database)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(
        json.dumps(
            {
                "status": "ok",
                "output": str(args.output),
                "stocks": len(payload["stocks"]),
                "latestMarketDate": payload["meta"]["latestMarketDate"],
            }
        )
    )


if __name__ == "__main__":
    main()

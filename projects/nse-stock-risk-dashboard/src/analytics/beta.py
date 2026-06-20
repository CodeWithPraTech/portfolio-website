"""Beta analytics."""


def calculate_beta(stock_returns, benchmark_returns):
    aligned = stock_returns.align(benchmark_returns, join="inner")
    stock, benchmark = aligned
    variance = benchmark.var()
    if variance == 0:
        return None
    return stock.cov(benchmark) / variance

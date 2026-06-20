"""Correlation analytics."""


def return_correlation(stock_returns, benchmark_returns):
    stock, benchmark = stock_returns.align(benchmark_returns, join="inner")
    return stock.corr(benchmark)

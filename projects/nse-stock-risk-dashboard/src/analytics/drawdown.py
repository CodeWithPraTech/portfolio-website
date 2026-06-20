"""Drawdown analytics."""


def add_drawdown(frame):
    frame = frame.sort_values(["Symbol", "Date"]).copy()
    running_high = frame.groupby("Symbol")["Adj Close"].cummax()
    frame["drawdown"] = (frame["Adj Close"] / running_high) - 1
    return frame

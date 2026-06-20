"""Return-based feature helpers."""

import numpy as np


def add_return_features(frame):
    frame = frame.sort_values(["Symbol", "Date"]).copy()
    frame["daily_return"] = frame.groupby("Symbol")["Adj Close"].pct_change()
    frame["log_return"] = frame.groupby("Symbol")["Adj Close"].transform(lambda values: np.log(values / values.shift(1)))
    return frame

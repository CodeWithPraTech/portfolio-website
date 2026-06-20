"""Volatility analytics."""


def add_rolling_volatility(frame, window=20, annualization=252):
    frame = frame.copy()
    frame[f"volatility_{window}d"] = (
        frame.groupby("Symbol")["daily_return"]
        .rolling(window)
        .std()
        .reset_index(level=0, drop=True)
        * (annualization ** 0.5)
    )
    return frame

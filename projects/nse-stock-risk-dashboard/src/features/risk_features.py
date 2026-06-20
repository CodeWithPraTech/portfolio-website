"""Combined risk feature pipeline."""

from src.analytics.drawdown import add_drawdown
from src.analytics.volatility import add_rolling_volatility
from src.features.return_features import add_return_features


def build_risk_features(frame):
    featured = add_return_features(frame)
    featured = add_rolling_volatility(featured)
    featured = add_drawdown(featured)
    return featured

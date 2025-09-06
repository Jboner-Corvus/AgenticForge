import os
import requests

ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')

def get_global_quote(symbol):
    if not ALPHA_VANTAGE_API_KEY:
        raise ValueError("ALPHA_VANTAGE_API_KEY not set in environment variables.")
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def get_time_series_daily(symbol):
    if not ALPHA_VANTAGE_API_KEY:
        raise ValueError("ALPHA_VANTAGE_API_KEY not set in environment variables.")
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=full&apikey={ALPHA_VANTAGE_API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

import pandas as pd

# Placeholder for RSI and SMA functions
def calculate_rsi(data, window=14):
    # data should be a pandas Series of close prices
    diff = data.diff(1).dropna()
    gain = diff.mask(diff < 0, 0)
    loss = -diff.mask(diff > 0, 0)
    avg_gain = gain.ewm(com=window - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=window - 1, adjust=False).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_sma(data, window):
    # data should be a pandas Series of close prices
    return data.rolling(window=window).mean()

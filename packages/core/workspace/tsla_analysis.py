#!/usr/bin/env python3
import json
import sys
import os
sys.path.append(os.path.dirname(__file__))

from alpha_vantage_utils import get_time_series_daily, get_global_quote
import pandas as pd
from datetime import datetime, timedelta

def calculate_support_resistance(prices, window=20):
    """Calculate support and resistance levels using rolling min/max"""
    support = prices.rolling(window=window, center=True).min()
    resistance = prices.rolling(window=window, center=True).max()
    return support.iloc[-1], resistance.iloc[-1]

def analyze_tsla():
    """Fetch TSLA data and perform technical analysis"""
    try:
        print("🔍 Fetching TSLA data from Alpha Vantage...")

        # Get current quote
        quote_data = get_global_quote('TSLA')
        current_price = float(quote_data['Global Quote']['05. price'])
        current_volume = int(quote_data['Global Quote']['06. volume'])

        # Get historical data
        historical_data = get_time_series_daily('TSLA')

        # Process data
        time_series = historical_data['Time Series (Daily)']
        df_data = []

        for date, values in time_series.items():
            df_data.append({
                'date': date,
                'open': float(values['1. open']),
                'high': float(values['2. high']),
                'low': float(values['3. low']),
                'close': float(values['4. close']),
                'volume': int(values['5. volume'])
            })

        df = pd.DataFrame(df_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').tail(100)  # Last 100 days

        # Calculate support and resistance
        support_price, resistance_price = calculate_support_resistance(df['close'])

        # Calculate RSI and SMA
        df['rsi'] = calculate_rsi(df['close'])
        df['sma_20'] = calculate_sma(df['close'], 20)
        df['sma_50'] = calculate_sma(df['close'], 50)

        # Prepare chart data
        chart_data = []
        for _, row in df.iterrows():
            chart_data.append({
                'time': row['date'].strftime('%Y-%m-%d'),
                'open': row['open'],
                'high': row['high'],
                'low': row['low'],
                'close': row['close']
            })

        # Analysis results
        analysis = {
            'current_price': current_price,
            'current_volume': current_volume,
            'support_level': support_price,
            'resistance_level': resistance_price,
            'rsi_current': df['rsi'].iloc[-1],
            'sma_20': df['sma_20'].iloc[-1],
            'sma_50': df['sma_50'].iloc[-1],
            'trend': 'BULLISH' if current_price > df['sma_20'].iloc[-1] else 'BEARISH',
            'chart_data': chart_data
        }

        return analysis

    except Exception as e:
        print(f"❌ Error in analysis: {e}")
        return None

def calculate_rsi(data, window=14):
    """Calculate RSI indicator"""
    diff = data.diff(1).dropna()
    gain = diff.mask(diff < 0, 0)
    loss = -diff.mask(diff > 0, 0)
    avg_gain = gain.ewm(com=window - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=window - 1, adjust=False).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_sma(data, window):
    """Calculate Simple Moving Average"""
    return data.rolling(window=window).mean()

if __name__ == "__main__":
    analysis = analyze_tsla()
    if analysis:
        print("✅ Analysis completed successfully!")
        print(f"📊 Current Price: ${analysis['current_price']:.2f}")
        print(f"📈 Support: ${analysis['support_level']:.2f}")
        print(f"📉 Resistance: ${analysis['resistance_level']:.2f}")
        print(f"📊 RSI: {analysis['rsi_current']:.2f}")
        print(f"📈 Trend: {analysis['trend']}")

        # Save analysis to JSON for HTML
        with open('tsla_analysis_data.json', 'w') as f:
            json.dump(analysis, f, indent=2)
    else:
        print("❌ Analysis failed")
        sys.exit(1)
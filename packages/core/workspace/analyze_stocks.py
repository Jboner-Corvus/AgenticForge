import requests
import json
import os
from datetime import datetime

ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY', 'demo') # Using 'demo' for testing without a real key

def get_daily_data(symbol):
    url = f'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}&outputsize=compact'
    response = requests.get(url)
    data = response.json()
    if "Time Series (Daily)" not in data:
        print(f"Error fetching data for {symbol}: {data.get('Note', 'Unknown error')}", file=sys.stderr)
        return None
    return data["Time Series (Daily)"]

def calculate_performance(daily_data, period_days=30):
    if not daily_data:
        return None

    sorted_dates = sorted(daily_data.keys(), reverse=True)
    if len(sorted_dates) < period_days:
        # Not enough data for the requested period, use available data
        period_dates = sorted_dates
    else:
        period_dates = sorted_dates[:period_days]
    
    # Ensure we have at least two points to calculate change
    if len(period_dates) < 2:
        return None

    start_date = period_dates[-1]
    end_date = period_dates[0]
    
    start_price = float(daily_data[start_date]["4. close"])
    end_price = float(daily_data[end_date]["4. close"])

    # Handle cases where start_price is zero to avoid division by zero
    if start_price == 0:
        return 0.0
        
    performance = ((end_price - start_price) / start_price) * 100
    return performance

def main():
    spy_data = get_daily_data('SPY')
    aapl_data = get_daily_data('AAPL')

    if spy_data and aapl_data:
        spy_perf = calculate_performance(spy_data)
        aapl_perf = calculate_performance(aapl_data)
        
        print(f"--- Stock Performance Comparison (Last 30 Days) ---")
        print(f"S&P 500 (SPY) Performance: {spy_perf:.2f}% (approx)")
        print(f"Apple (AAPL) Performance: {aapl_perf:.2f}% (approx)")

        if spy_perf is not None and aapl_perf is not None:
            if aapl_perf > spy_perf:
                print(f"Apple (AAPL) outperformed the S&P 500 (SPY) by {(aapl_perf - spy_perf):.2f}% over the last 30 days.")
            elif spy_perf > aapl_perf:
                print(f"S&P 500 (SPY) outperformed Apple (AAPL) by {(spy_perf - aapl_perf):.2f}% over the last 30 days.")
            else:
                print("Both SPY and AAPL had similar performance over the last 30 days.")
        else:
            print("Could not fully calculate performance for both SPY and AAPL.")
    else:
        print("Failed to retrieve data for SPY or AAPL. Please check your API key and try again.")

if __name__ == '__main__':
    main()

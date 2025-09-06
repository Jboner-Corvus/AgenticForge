#!/usr/bin/env python3
import os
import sys
sys.path.append('.')

# Test basic API functions without pandas
def test_alpha_vantage_basic():
    print("🧪 Testing Alpha Vantage API Integration (Basic)")
    print("=" * 50)

    # Check API key
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        print("❌ ERROR: ALPHA_VANTAGE_API_KEY not found in environment")
        return False

    print(f"✅ API Key found: {api_key[:10]}...")

    # Test basic HTTP request to Alpha Vantage
    import requests

    try:
        print("\n📈 Testing Global Quote for TSLA...")
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=TSLA&apikey={api_key}"
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()

        if "Global Quote" in result:
            price = result["Global Quote"]["05. price"]
            volume = result["Global Quote"]["06. volume"]
            print(f"✅ SUCCESS: TSLA Price: ${price}")
            print(f"✅ SUCCESS: TSLA Volume: {volume}")
        else:
            print(f"❌ ERROR: Unexpected response format: {result}")
            return False

    except Exception as e:
        print(f"❌ ERROR getting global quote: {e}")
        return False

    # Test time series
    try:
        print("\n📊 Testing Time Series Daily for TSLA...")
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=TSLA&outputsize=compact&apikey={api_key}"
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()

        if "Time Series (Daily)" in result:
            time_series = result["Time Series (Daily)"]
            latest_date = list(time_series.keys())[0]
            latest_data = time_series[latest_date]
            print(f"✅ SUCCESS: Latest data for {latest_date}")
            print(f"✅ SUCCESS: Close price: ${latest_data['4. close']}")
        else:
            print(f"❌ ERROR: Unexpected response format or API limit reached")
            print(f"Response keys: {list(result.keys())}")
            return False

    except Exception as e:
        print(f"❌ ERROR getting time series: {e}")
        return False

    print("\n🎉 All tests passed! Alpha Vantage API working correctly.")
    return True

if __name__ == "__main__":
    test_alpha_vantage_basic()
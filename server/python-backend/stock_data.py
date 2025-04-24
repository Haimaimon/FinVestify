from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
from ta import add_all_ta_features
import requests
from transformers import pipeline
import time
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Hugging Face Sentiment Analysis Pipeline
sentiment_analyzer = pipeline("sentiment-analysis")

# NewsAPI Configuration
NEWS_API_KEY = "941c905a04a24e6c8edee618209cf60e"
NEWS_API_URL = "https://newsapi.org/v2/everything"
POLYGON_API_KEY = "QK_TtkEeZYSntEOQwX5YeSfNwhbsYtfd"

# -----------------------------------------------
# Utility Functions
# -----------------------------------------------

def fetch_stock_news(stock_name):
    """
    Fetches news articles related to the given stock using NewsAPI.
    """
    params = {
        "q": stock_name,
        "apiKey": NEWS_API_KEY,
        "language": "en",
        "sortBy": "relevance"
    }
    response = requests.get(NEWS_API_URL, params=params)
    if response.status_code != 200:
        raise Exception("Failed to fetch news")
    return response.json().get("articles", [])

def analyze_sentiment_with_huggingface(content):
    """
    Analyzes the sentiment of a given text using Hugging Face.
    """
    try:
        result = sentiment_analyzer(content[:512])  # Hugging Face supports up to 512 tokens
        sentiment = result[0]["label"]
        confidence = result[0]["score"]
        return sentiment, confidence
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        return "Neutral", 0.0

def convert_period_to_start_date(period_str):
    """
    Converts yFinance-style period like '6mo' or '1y' into start_date (YYYY-MM-DD).
    """
    now = datetime.now()
    if period_str.endswith("d"):
        days = int(period_str.replace("d", ""))
        return (now - timedelta(days=days)).strftime("%Y-%m-%d")
    elif period_str.endswith("mo"):
        months = int(period_str.replace("mo", ""))
        return (now - relativedelta(months=months)).strftime("%Y-%m-%d")
    elif period_str.endswith("y"):
        years = int(period_str.replace("y", ""))
        return (now - relativedelta(years=years)).strftime("%Y-%m-%d")
    else:
        raise ValueError("Unsupported period format")
    
def fetch_historical_data(stock_name, period="6mo"):
    try:
        print(f"📡 Fetching historical data for {stock_name} from Polygon.io, period={period}")
        start_date = convert_period_to_start_date(period)
        end_date = datetime.now().strftime("%Y-%m-%d")

        url = f"https://api.polygon.io/v2/aggs/ticker/{stock_name}/range/1/day/{start_date}/{end_date}?adjusted=true&sort=asc&limit=50000&apiKey={POLYGON_API_KEY}"
        response = requests.get(url)

        if response.status_code != 200:
            raise Exception("Polygon API request failed")

        data = response.json()
        if "results" not in data or not data["results"]:
            raise Exception("No historical data found")

        df = pd.DataFrame(data["results"])
        df["Date"] = pd.to_datetime(df["t"], unit="ms").dt.strftime("%Y-%m-%d")
        df.rename(columns={"o": "Open", "h": "High", "l": "Low", "c": "Close", "v": "Volume"}, inplace=True)
        return df[["Date", "Open", "High", "Low", "Close", "Volume"]]

    except Exception as e:
        print(f"❌ Error fetching historical data from Polygon: {e}")
        return pd.DataFrame()


def calculate_historical_impact(stock_name, published_at, sentiment):
    """
    Fetch closing prices from Polygon and calculate sentiment impact.
    """
    try:
        published_date = published_at.split("T")[0]
        start_date = published_date
        end_date = (datetime.strptime(published_date, "%Y-%m-%d") + timedelta(days=3)).strftime("%Y-%m-%d")

        url = f"https://api.polygon.io/v2/aggs/ticker/{stock_name}/range/1/day/{start_date}/{end_date}?adjusted=true&sort=asc&limit=3&apiKey={POLYGON_API_KEY}"
        response = requests.get(url)

        if response.status_code != 200:
            raise Exception("Polygon API error")

        data = response.json()
        prices = data.get("results", [])
        if len(prices) < 2:
            return f"Not enough data to analyze impact for {stock_name} on {published_date}"

        close_price = prices[0]["c"]
        next_day_close_price = prices[1]["c"]
        price_change = ((next_day_close_price - close_price) / close_price) * 100

        if sentiment == "POSITIVE" and price_change > 0:
            return f"Positive impact: Price increased by {price_change:.2f}%"
        elif sentiment == "NEGATIVE" and price_change < 0:
            return f"Negative impact: Price decreased by {abs(price_change):.2f}%"
        elif sentiment == "POSITIVE" and price_change < 0:
            return f"Mismatch: Sentiment was positive but price decreased by {abs(price_change):.2f}%"
        elif sentiment == "NEGATIVE" and price_change > 0:
            return f"Mismatch: Sentiment was negative but price increased by {price_change:.2f}%"
        else:
            return f"Neutral impact: No significant change ({price_change:.2f}%)"
    except Exception as e:
        print(f"❌ Error calculating impact with Polygon: {e}")
        return "Error calculating impact"

def fetch_historical_sentiment(stock_name):
    """
    Fetches sentiment data for historical news articles related to the stock.
    """
    print(f"Fetching historical sentiment for stock: {stock_name}")
    try:
        articles = fetch_stock_news(stock_name)
        if not articles:
            raise ValueError(f"No news articles found for stock: {stock_name}")

        sentiment_data = []
        for article in articles:
            headline = article.get("title", "No Title")
            published_date = article.get("publishedAt", "")[:10]
            sentiment, confidence = analyze_sentiment_with_huggingface(headline)

            sentiment_data.append({
                "Date": published_date,
                "Headline": headline,
                "Sentiment": sentiment,
                "Confidence": confidence
            })
        return pd.DataFrame(sentiment_data)
    except Exception as e:
        print(f"Error fetching historical sentiment: {e}")
        return pd.DataFrame()

# -----------------------------------------------
# API Routes
# -----------------------------------------------

@app.route('/api/stock-news', methods=['POST'])
def get_stock_news():
    """
    API endpoint to fetch and analyze stock news.
    """
    data = request.get_json()
    stock_name = data.get("stock_name")
    if not stock_name:
        return jsonify({"error": "Stock name is required"}), 400

    try:
        news_articles = fetch_stock_news(stock_name)
        analyzed_articles = []

        for article in news_articles[:10]:
            sentiment, confidence = analyze_sentiment_with_huggingface(article.get("content", ""))
            impact = calculate_historical_impact(stock_name, article.get("publishedAt", ""), sentiment)
            analyzed_articles.append({
                "headline": article.get("title", ""),
                "content": article.get("content", ""),
                "published_at": article.get("publishedAt", ""),
                "sentiment": sentiment,
                "confidence": confidence,
                "impact": impact
            })
        return jsonify(analyzed_articles)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/historical-sentiment' , methods=['POST'])
def analyze_historical_sentiment():
    data = request.get_json()
    stock_name = data.get("stock_name")

    if not stock_name:
        return jsonify({"error": "Stock name is required"}), 400

    try:
        # שליפת הנתונים
        stock_data = fetch_historical_data(stock_name)
        sentiment_data = fetch_historical_sentiment(stock_name)

        if stock_data.empty or sentiment_data.empty:
            return jsonify({"error": "No data available for analysis."}), 400

        # עיבוד תאריכים
        stock_data["Date"] = pd.to_datetime(stock_data["Date"], errors="coerce").dt.strftime("%Y-%m-%d")
        sentiment_data["Date"] = pd.to_datetime(sentiment_data["Date"], errors="coerce").dt.strftime("%Y-%m-%d")

        # סינון נתונים לא חוקיים
        stock_data = stock_data.dropna(subset=["Date"])
        sentiment_data = sentiment_data.dropna(subset=["Date"])

        # מיזוג הנתונים
        combined_data = pd.merge(stock_data, sentiment_data, on="Date", how="inner")

        # חישוב שינויי המחיר באחוזים
        combined_data["Price_Change"] = combined_data["Close"].pct_change() * 100

        # חישוב הצלחת סנטימנט חיובי ושלילי
        positive_impact = combined_data[(combined_data["Sentiment"] == "POSITIVE") & (combined_data["Price_Change"] > 0)]
        negative_impact = combined_data[(combined_data["Sentiment"] == "NEGATIVE") & (combined_data["Price_Change"] < 0)]

        positive_success_rate = len(positive_impact) / len(combined_data[combined_data["Sentiment"] == "POSITIVE"]) * 100
        negative_success_rate = len(negative_impact) / len(combined_data[combined_data["Sentiment"] == "NEGATIVE"]) * 100

        # הוספת אינדיקטורים לגרף
        combined_data["Indicator"] = combined_data.apply(
            lambda row: "👍" if row["Sentiment"] == "POSITIVE" and row["Price_Change"] > 0 else
                        "👎" if row["Sentiment"] == "NEGATIVE" and row["Price_Change"] < 0 else "⚠️", axis=1
        )

        # הכנת נתוני המחיר לגרף עם אינדיקטורים
        price_data = combined_data[["Date", "Close", "Price_Change", "Indicator"]]
        price_data["Date"] = pd.to_datetime(price_data["Date"], errors="coerce")
        price_data = price_data.dropna()
        price_data["BusinessDay"] = price_data["Date"].apply(
            lambda x: {"year": x.year, "month": x.month, "day": x.day} if not pd.isnull(x) else None
        )
        price_data = price_data.dropna(subset=["BusinessDay"])
        price_data = price_data[["BusinessDay", "Close", "Price_Change", "Indicator"]].to_dict(orient="records")


        # הכנת מגמות צבע
        combined_data["Trend_Color"] = combined_data["Price_Change"].apply(
            lambda change: "green" if change > 0 else "red"
        )

        return jsonify({
            "positive_success_rate": positive_success_rate,
            "negative_success_rate": negative_success_rate,
            "total_analyzed_days": len(combined_data),
            "news_articles": sentiment_data[["Date", "Headline", "Sentiment", "Confidence"]].to_dict(orient="records"),
            "price_data": price_data,  # נתוני מחיר לגרף
            "trend_colors": combined_data[["Date", "Trend_Color"]].to_dict(orient="records")  # צבעי מגמה
        })
    except Exception as e:
        print(f"Error in analyze_historical_sentiment: {e}")
        return jsonify({"error": str(e)}), 500



def map_period_to_dates(period):
    """
    ממיר period כמו '1y', '5d', 'max' לתאריכים התחלה וסיום (YYYY-MM-DD)
    """
    now = datetime.now()
    period_map = {
        "1d": now - timedelta(days=1),
        "5d": now - timedelta(days=5),
        "1mo": now - timedelta(days=30),
        "3mo": now - timedelta(days=90),
        "6mo": now - timedelta(days=180),
        "1y": now - timedelta(days=365),
        "2y": now - timedelta(days=730),
        "5y": now - timedelta(days=1825),
        "10y": now - timedelta(days=3650),
        "ytd": datetime(now.year, 1, 1),
        "max": datetime(2010, 1, 1),  # תאריך ברירת מחדל
    }
    start_date = period_map.get(period.lower(), now - timedelta(days=365))
    return start_date.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")


def fetch_stock_data(ticker, period="1y", interval="1d"):
    """
    Fetch historical stock data using Polygon.io API.
    """
    print(f"📡 Fetching data for ticker: {ticker}, period: {period}, interval: {interval}")

    interval_map = {
        "1m": ("minute", 1),
        "5m": ("minute", 5),
        "15m": ("minute", 15),
        "30m": ("minute", 30),
        "1h": ("hour", 1),
        "1d": ("day", 1),
        "1wk": ("week", 1),
        "1mo": ("month", 1),
    }

    if interval not in interval_map:
        print("❌ Invalid interval provided")
        return pd.DataFrame()

    timeframe, multiplier = interval_map[interval]

    # ✅ מחשבים תאריכים לפי תקופת ה־period
    start_date, end_date = map_period_to_dates(period)

    # 📦 בניית ה-URL ל-Polygon
    url = (
        f"https://api.polygon.io/v2/aggs/ticker/{ticker.upper()}/range/{multiplier}/{timeframe}/"
        f"{start_date}/{end_date}?adjusted=true&sort=asc&limit=5000&apiKey={POLYGON_API_KEY}"
    )

    try:
        response = requests.get(url)
        data = response.json()

        if "results" not in data or not data["results"]:
            print("⚠️ No data found for the requested ticker and interval.")
            return pd.DataFrame()

        df = pd.DataFrame(data["results"])
        df["t"] = pd.to_datetime(df["t"], unit="ms")
        df.set_index("t", inplace=True)

        df.rename(columns={
            "o": "Open",
            "h": "High",
            "l": "Low",
            "c": "Close",
            "v": "Volume"
        }, inplace=True)

        return df[["Open", "High", "Low", "Close", "Volume"]]

    except Exception as e:
        print(f"❌ Error fetching stock data from Polygon.io: {e}")
        return pd.DataFrame()



def calculate_moving_averages(data, short_window, long_window):
    """
    Adds moving averages to the stock data.
    """
    print(f"Calculating moving averages: MA{short_window}, MA{long_window}")
    print(f"Data before adding moving averages:\n{data.head()}")

    data[f"MA{short_window}"] = data["Close"].rolling(window=short_window).mean()
    data[f"MA{long_window}"] = data["Close"].rolling(window=long_window).mean()

    print(f"Data after adding moving averages:\n{data[[f'MA{short_window}', f'MA{long_window}']].head()}")
    return data



def evaluate_signals(data, short_ma, long_ma):
    """
    Evaluates buy and sell signals based on moving averages.
    """
    print(f"Evaluating signals: {short_ma} > {long_ma}, {short_ma} < {long_ma}")
    print(f"Data before evaluating signals:\n{data[[short_ma, long_ma]].head()}")

    data["buy_signal"] = data[short_ma] > data[long_ma]
    data["sell_signal"] = data[short_ma] < data[long_ma]

    print(f"Buy signals:\n{data['buy_signal'].value_counts()}")
    print(f"Sell signals:\n{data['sell_signal'].value_counts()}")
    return data



def simulate_strategy(data, indicator=None, short_ma=None, long_ma=None):
    """
    Simulates a trading strategy and calculates profit/loss based on signals or indicators.
    """
    print(f"Simulating strategy on data with indicator: {indicator}, short_ma: {short_ma}, long_ma: {long_ma}")
    positions = []
    total_profit_loss = 0
    buy_price = None

    for index, row in data.iterrows():
         # Buy signal based on moving averages or selected indicator
        if indicator == "macd" and "MACD" in row and "Signal_Line" in row:
            if row["MACD"] > row["Signal_Line"] and not buy_price:
                buy_price = row["Close"]
                positions.append({"type": "buy", "price": buy_price, "date": index.strftime('%Y-%m-%d'), "profit_loss": None})
        elif indicator == "rsi" and "RSI" in row:
            if row["RSI"] < 30 and not buy_price:
                buy_price = row["Close"]
                positions.append({"type": "buy", "price": buy_price, "date": index.strftime('%Y-%m-%d'), "profit_loss": None})
        elif short_ma and long_ma:
            if row[f"MA{short_ma}"] > row[f"MA{long_ma}"] and not buy_price:
                buy_price = row["Close"]
                positions.append({"type": "buy", "price": buy_price, "date": index.strftime('%Y-%m-%d'), "profit_loss": None})

        # Sell signal
        if indicator == "macd" and "MACD" in row and "Signal_Line" in row:
            if row["MACD"] < row["Signal_Line"] and buy_price:
                sell_price = row["Close"]
                profit_loss = sell_price - buy_price
                total_profit_loss += profit_loss
                positions.append({
                    "type": "sell", "price": sell_price, "date": index.strftime('%Y-%m-%d'),
                    "profit_loss": profit_loss
                })
                buy_price = None
        elif indicator == "rsi" and "RSI" in row:
            if row["RSI"] > 70 and buy_price:
                sell_price = row["Close"]
                profit_loss = sell_price - buy_price
                total_profit_loss += profit_loss
                positions.append({
                    "type": "sell", "price": sell_price, "date": index.strftime('%Y-%m-%d'),
                    "profit_loss": profit_loss
                })
                buy_price = None
        elif short_ma and long_ma:
            if row[f"MA{short_ma}"] < row[f"MA{long_ma}"] and buy_price:
                sell_price = row["Close"]
                profit_loss = sell_price - buy_price
                total_profit_loss += profit_loss
                positions.append({
                    "type": "sell", "price": sell_price, "date": index.strftime('%Y-%m-%d'),
                    "profit_loss": profit_loss
                })
                buy_price = None

    print(f"Final positions: {positions}")
    print(f"Total Profit/Loss: {total_profit_loss}")
    return positions, total_profit_loss

def calculate_macd(data, short_period=12, long_period=26, signal_period=9):
    """
    Calculates MACD and Signal line for the stock data.
    """
    print("Calculating MACD")
    short_ema = data['Close'].ewm(span=short_period, adjust=False).mean()
    long_ema = data['Close'].ewm(span=long_period, adjust=False).mean()
    data['MACD'] = short_ema - long_ema
    data['Signal_Line'] = data['MACD'].ewm(span=signal_period, adjust=False).mean()
    print("MACD calculated successfully")
    return data

def calculate_rsi(data, period=14):
    """
    Calculates RSI (Relative Strength Index).
    """
    print("Calculating RSI")
    delta = data['Close'].diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)

    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()

    rs = avg_gain / avg_loss
    data['RSI'] = 100 - (100 / (1 + rs))
    print("RSI calculated successfully")
    return data

def apply_indicators(data, indicator):
    """
    Applies the selected indicator to the stock data.
    """
    if indicator == "macd":
        return calculate_macd(data)
    elif indicator == "rsi":
        return calculate_rsi(data)
    elif indicator == "ema":
        data['EMA'] = data['Close'].ewm(span=20, adjust=False).mean()
        return data
    else:
        return data  # If no indicator is selected, return data as is.

# -----------------------------------------------
# מסלול API לבדיקת אסטרטגיה
# -----------------------------------------------

@app.route('/api/strategy', methods=['POST'])
def strategy_test():
    """
    API endpoint to test a stock trading strategy.
    """
    data = request.get_json()
    ticker = data.get("ticker")
    short_ma = data.get("ma_short")
    long_ma = data.get("ma_long")
    period = data.get("period", "1y")
    interval = data.get("interval", "1d")
    indicator = data.get("indicator", "none")

    print(f"Received request: Ticker = {ticker}, Short MA = {short_ma}, Long MA = {long_ma}, Period = {period}, Interval = {interval}, Indicator = {indicator}")

    if not ticker:
        return jsonify({"error": "Ticker is required"}), 400

    try:
        # Fetch stock data
        stock_data = fetch_stock_data(ticker, period, interval)
        if stock_data.empty:
            return jsonify({"error": "No stock data found or required columns are missing"}), 404

        # Apply indicators
        stock_data = apply_indicators(stock_data, indicator)

        # Apply moving averages only if provided
        if short_ma and long_ma:
            short_ma, long_ma = int(short_ma), int(long_ma)
            stock_data = calculate_moving_averages(stock_data, short_ma, long_ma)
            stock_data = evaluate_signals(stock_data, f"MA{short_ma}", f"MA{long_ma}")

        # Simulate strategy based on indicator or moving averages
        positions, total_profit_loss = simulate_strategy(
            stock_data,
            indicator=indicator,
            short_ma=short_ma if indicator == "none" else None,
            long_ma=long_ma if indicator == "none" else None
        )
        
            
        # Prepare results
        results = {
            "ticker": ticker,
            "total_profit_loss": total_profit_loss,
            "positions": positions,
            "indicator_effect": f"Indicator '{indicator}' applied and influenced the results." if indicator != "none" else "Moving averages applied and influenced the results.",
        }
        return jsonify(results)
    except Exception as e:
        print(f"Error in strategy_test: {e}")
        return jsonify({"error": str(e)}), 500

    

# 🔑 API Key ל-Polygon.io (החלף במפתח האישי שלך)
@app.route('/api/stock/<ticker>')
def get_stock_data(ticker):
    interval = request.args.get('interval', '1d')

    print(f"\n=== Fetching Stock Data from Polygon.io ===")
    print(f"Ticker: {ticker}, Interval: {interval}")

    interval_map = {
        "1m": "minute", "2m": "minute", "5m": "minute", "15m": "minute", "30m": "minute",
        "1h": "hour", "1d": "day", "5d": "day", "1wk": "week", "1mo": "month", "3mo": "month"
    }

    if interval not in interval_map:
        return jsonify({"error": "Invalid interval"}), 400

    timeframe = interval_map[interval]

    # 💡 טווח תאריכים דינמי לפי אינטרוול
    now = datetime.now()
    if timeframe == "minute":
        start_date = (now - timedelta(days=5)).strftime("%Y-%m-%d")  # 5 ימים אחרונים
    elif timeframe == "hour":
        start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")  # חודש
    elif timeframe == "day":
        start_date = (now - timedelta(days=730)).strftime("%Y-%m-%d")  # שנתיים אחרונות
    else:
        start_date = "2010-01-01"

    end_date = now.strftime("%Y-%m-%d")

    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/{timeframe}/{start_date}/{end_date}?apiKey={POLYGON_API_KEY}"

    try:
        response = requests.get(url)
        data = response.json()

        if "results" not in data or not data["results"]:
            print(f"ERROR: No data found for {ticker}")
            return jsonify({"error": "No data found"}), 404

        prices = data["results"]
        processed_data = {
            "dates": [item["t"] for item in prices],
            "open": [item["o"] for item in prices],
            "high": [item["h"] for item in prices],
            "low": [item["l"] for item in prices],
            "prices": [item["c"] for item in prices],
        }

        return jsonify(processed_data)

    except Exception as e:
        print(f"Error fetching data from Polygon.io: {e}")
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(port=5000,debug=True)
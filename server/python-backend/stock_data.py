from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from ta import add_all_ta_features
from ta.trend import SMAIndicator
import requests
from transformers import pipeline
from datetime import datetime, timedelta


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Hugging Face Sentiment Analysis Pipeline
sentiment_analyzer = pipeline("sentiment-analysis")

# NewsAPI Configuration
NEWS_API_KEY = "941c905a04a24e6c8edee618209cf60e"
NEWS_API_URL = "https://newsapi.org/v2/everything"

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

def fetch_historical_data(stock_name, period="6mo"):
    """
    Fetches historical stock data for the given stock using yfinance.
    """
    print(f"Fetching historical data for stock: {stock_name}, period: {period}")
    try:
        # Fetch stock data with the specified period
        stock_data = yf.download(stock_name, period=period, interval="1d", progress=False)
        print(f"Fetched data length for {period}: {len(stock_data)} rows")  # Log the length of fetched data
        
        if stock_data.empty:
            raise ValueError(f"No historical data found for stock: {stock_name}, period: {period}")

        # Handle MultiIndex columns
        if isinstance(stock_data.columns, pd.MultiIndex):
            stock_data.columns = stock_data.columns.droplevel(0)

        # Standardize column names
        stock_data.columns = ["Adj_Close", "Close", "High", "Low", "Open", "Volume"]

        # Reset index to make `Date` a column
        stock_data.reset_index(inplace=True)

        print(f"First few rows of fetched data:\n{stock_data.head()}")  # Log the first few rows of data
        return stock_data
    except Exception as e:
        print(f"Error fetching historical data: {e}")
        return pd.DataFrame()




def calculate_historical_impact(stock_name, published_at, sentiment):
    """
    Calculates the impact of sentiment on stock price based on historical data.
    """
    try:
        published_date = published_at.split("T")[0]
        next_day_date = (datetime.strptime(published_date, "%Y-%m-%d") + timedelta(days=2)).strftime("%Y-%m-%d")
        stock_data = yf.download(stock_name, start=published_date, end=next_day_date, progress=False)

        if stock_data.empty or "Close" not in stock_data.columns or stock_data["Close"].empty:
            return f"No valid close price data for {stock_name} on {published_date} or the next day"

        close_price = stock_data["Close"].iloc[0]
        next_day_close_price = stock_data["Close"].iloc[-1]
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
        print(f"Error calculating impact: {e}")
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


    
# פונקציה לבדיקה האם התנאי מתקיים
def evaluate_condition(data, condition):
    try:
        # Replace simple placeholders with DataFrame columns
        condition = condition.replace("MA", "data['MA']")
        return data.eval(condition)
    except Exception as e:
        print(f"Error evaluating condition: {e}")
        return pd.Series([False] * len(data))

# פונקציה לבדיקת אסטרטגיה
@app.route('/api/strategy', methods=['POST'])
def strategy_test():
    data = request.get_json()
    ticker = data.get("ticker")
    interval = data.get("interval", "1d")
    period = data.get("period", "1y")
    buy_condition = data.get("buy_condition")
    sell_condition = data.get("sell_condition")

    # שליפה של הממוצעים מהבקשה או הגדרת ערכי ברירת מחדל
    ma_short_period = int(data.get("ma_short", 20))
    ma_long_period = int(data.get("ma_long", 50))
    
    # הורדת נתונים
    stock_data = yf.download(ticker, period=period, interval=interval)
    if stock_data.empty:
        return jsonify({"error": "No data found for the ticker"}), 404

    # חישוב הממוצעים הנעים בהתבסס על הפרמטרים שהתקבלו
    stock_data[f'MA{ma_short_period}'] = SMAIndicator(stock_data['Close'], window=ma_short_period).sma_indicator()
    stock_data[f'MA{ma_long_period}'] = SMAIndicator(stock_data['Close'], window=ma_long_period).sma_indicator()
    stock_data.dropna(inplace=True)

    stock_data['buy_signal'] = evaluate_condition(stock_data, buy_condition)
    stock_data['sell_signal'] = evaluate_condition(stock_data, sell_condition)

    positions = []
    buy_price = None
    total_profit_loss = 0

    for index, row in stock_data.iterrows():
        if row['buy_signal'] and buy_price is None:
            buy_price = row['Close']
            positions.append({"type": "buy", "price": buy_price, "date": index.strftime('%Y-%m-%d')})
        elif row['sell_signal'] and buy_price is not None:
            sell_price = row['Close']
            profit_loss = sell_price - buy_price
            total_profit_loss += profit_loss
            positions.append({
                "type": "sell", "price": sell_price, "date": index.strftime('%Y-%m-%d'),
                "profit_loss": profit_loss
            })
            buy_price = None

    results = {
        "ticker": ticker,
        "total_profit_loss": total_profit_loss,
        "buy_signals": [p for p in positions if p["type"] == "buy"],
        "sell_signals": [p for p in positions if p["type"] == "sell"]
    }

    return jsonify(results)
    
# Prepare data for training
def prepare_data(ticker, period, interval):
    df = yf.download(ticker, period=period, interval=interval)
    if df.empty:
        raise ValueError("No data fetched from yfinance.")
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
    print(f"Data fetched for {ticker} with period {period} and interval {interval}: {df.shape}")

    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(df)

    X_train, y_train = [], []
    for i in range(60, len(scaled_data)):
        X_train.append(scaled_data[i-60:i])
        y_train.append(scaled_data[i, 3])
    
    X_train, y_train = np.array(X_train), np.array(y_train)
    X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 5))

    return X_train, y_train, scaler

# Build LSTM model
def build_model(input_shape=(60,5)):
    model = tf.keras.Sequential([
        tf.keras.layers.LSTM(units=50, return_sequences=True, input_shape=input_shape),
        tf.keras.layers.LSTM(units=50, return_sequences=False),
        tf.keras.layers.Dense(units=25),
        tf.keras.layers.Dense(units=1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

# Train the model and save it
def train_model(ticker, period, interval):
    X_train, y_train, scaler = prepare_data(ticker, period, interval)
    model = build_model()
    model.fit(X_train, y_train, batch_size=1, epochs=1)
    model.save(f'{ticker}_model.h5')
    return scaler

# Predict stock price
def predict(ticker, scaler):
    model = tf.keras.models.load_model(f'{ticker}_model.h5')
    df = yf.download(ticker, period='60d', interval='1d')
    if df.empty:
        raise ValueError("No data fetched from yfinance for prediction.")
    
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']]

    last_60_days = df[-60:].values
    last_60_days_scaled = scaler.transform(last_60_days)

    X_test = []
    X_test.append(last_60_days_scaled)
    X_test = np.array(X_test)
    X_test = np.reshape(X_test, (X_test.shape[0], X_test.shape[1], 5))

    # תחזית מחירים
    pred_price = model.predict(X_test)

    # שחרור הנרמול אך ורק עבור עמודת מחיר הסגירה
    pred_price = scaler.inverse_transform(
        np.concatenate([np.zeros((pred_price.shape[0], 4)), pred_price], axis=1)
    )[:, 3]  # השאר רק את מחיר הסגירה

    return pred_price[0]

@app.route('/api/predict_stock', methods=['GET'])
def predict_stock():
    ticker = request.args.get('ticker')
    period = request.args.get('period', '1y')
    interval = request.args.get('interval', '1d')

    if not ticker:
        return jsonify({'error': 'Ticker is required'}), 400

    try:
        # Train and save scaler
        scaler = train_model(ticker, period, interval)
        # Predict using the trained model
        predicted_price = predict(ticker, scaler)
        return jsonify({'ticker': ticker, 'predicted_price': float(predicted_price)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<ticker>')
def get_stock_data(ticker):
    interval = request.args.get('interval', '1d')
    stock = yf.Ticker(ticker)

    try:
        # הגבלת התקופה לאינטרוולים קטנים (עד שנתיים)
        if interval in ['1m']:
            hist = stock.history(period="7d", interval=interval)
        elif interval in ['2m', '5m' ,'15m', '30m']:    
            hist = stock.history(period="60d", interval=interval)
        elif interval in ['1h']:    
            hist = stock.history(period="730d", interval=interval)    
        else:
            hist = stock.history(period="max", interval=interval)
        
        # If no data returned, raise an error
        if hist.empty:
            return jsonify({"error": "No data found for the specified interval"}), 404

        # Handle non-DateTime indices
        if not hasattr(hist.index, 'strftime'):
            hist.index = hist.index.to_pydatetime()
        
        data = {
            'dates': hist.index.strftime('%Y-%m-%d %H:%M:%S').tolist(),
            'prices': hist['Close'].tolist(),
            'open': hist['Open'].tolist(),
            'high': hist['High'].tolist(),
            'low': hist['Low'].tolist(),
        }
        
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000,debug=True)
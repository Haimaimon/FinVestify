from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from ta import add_all_ta_features
from ta.trend import SMAIndicator

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def calculate_strategy(df, buy_condition, sell_condition):
    buy_signals = []
    sell_signals = []
    current_position = None
    profit_loss_total = 0

    for i in range(1, len(df)):
        if buy_condition(df, i):
            buy_signals.append({'date': df.index[i].strftime('%Y-%m-%d'), 'price': df['Close'][i]})
            current_position = df['Close'][i]
        
        elif sell_condition(df, i) and current_position is not None:
            profit_loss = df['Close'][i] - current_position
            sell_signals.append({'date': df.index[i].strftime('%Y-%m-%d'), 'price': df['Close'][i], 'profit_loss': profit_loss})
            profit_loss_total += profit_loss
            current_position = None

    return buy_signals, sell_signals, profit_loss_total

@app.route('/api/strategy', methods=['POST'])
def test_strategy():
    data = request.json
    ticker = data.get("ticker")
    interval = data.get("interval", "1d")
    period = data.get("period", "1y")
    buy_condition_str = data.get("buy_condition")
    sell_condition_str = data.get("sell_condition")

    try:
        df = yf.download(ticker, period=period, interval=interval)
        if df.empty:
            return jsonify({"error": "No data found for the specified ticker"}), 404
        
        df['MA20'] = SMAIndicator(df['Close'], window=20).sma_indicator()
        df['MA200'] = SMAIndicator(df['Close'], window=200).sma_indicator()
        
        def buy_condition(df, i):
            return df['MA20'][i-1] < df['MA200'][i-1] and df['MA20'][i] > df['MA200'][i]
        
        def sell_condition(df, i):
            return df['MA20'][i-1] > df['MA200'][i-1] and df['MA20'][i] < df['MA200'][i]

        buy_signals, sell_signals, profit_loss_total = calculate_strategy(df, buy_condition, sell_condition)

        return jsonify({
            "dates": df.index.strftime('%Y-%m-%d').tolist(),
            "prices": df['Close'].tolist(),
            "buy_signals": buy_signals,
            "sell_signals": sell_signals,
            "total_profit_loss": profit_loss_total
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
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
    app.run(port=5000)

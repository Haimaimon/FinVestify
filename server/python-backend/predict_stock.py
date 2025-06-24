from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import os
import schedule
import time
from threading import Thread
import requests
 
app = Flask(__name__)
CORS(app)
'''
# פונקציה לטעינת נתוני המניה
def load_stock_data(stock_name):
    paths = [
        f"data/etfs/{stock_name}.csv",
        f"data/stocks/{stock_name}.csv"
    ]
    for file_path in paths:
        try:
            data = pd.read_csv(file_path, parse_dates=["Date"])
            print(f"Loaded data from {file_path}")
            print(f"Columns: {data.columns}")  # הדפסת העמודות הזמינות
            data['Date'] = pd.to_datetime(data['Date'])
            data.set_index('Date', inplace=True)
            data = clean_data_columns(data)  # ניקוי מבנה העמודות
            print(f"Data after cleaning columns: {data.head()}")  # הדפסת מספר שורות לדוגמה
            return data
        except FileNotFoundError:
            print(f"File not found: {file_path}")
        except KeyError as e:
            print(f"Error in data structure for {stock_name}: {e}")
    return None

'''
def load_stock_data(stock_name):
    file_path = "datastocks/sp500_stocks.csv"  # נתיב לקובץ עם כל המניות
    try:
        # קריאה לקובץ
        data = pd.read_csv(file_path, parse_dates=["Date"])
        print(f"Loaded data from {file_path}")
        
        # סינון המידע לפי שם המניה
        if "Symbol" not in data.columns:
            raise KeyError("Column 'Symbol' not found in the data.")
        
        stock_data = data[data["Symbol"] == stock_name]
        if stock_data.empty:
            raise ValueError(f"No data found for stock: {stock_name}")
        
        # עיבוד נתונים
        stock_data.set_index("Date", inplace=True)
        stock_data.sort_index(inplace=True)
        
        print(f"Filtered data for {stock_name}:")
        print(stock_data.head())  # הדפסת שורות ראשונות לבדיקה
        return stock_data

    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except Exception as e:
        print(f"Error loading stock data: {e}")
    return None



def clean_data_columns(data):
    """
    ניקוי מבנה הנתונים והסרת עמודות מקוננות תוך שמירה על ערכים רלוונטיים.
    """
    if isinstance(data.columns, pd.MultiIndex):
        print(f"Cleaning MultiIndex columns: {data.columns}")
        # בדיקה אילו עמודות אינן מכילות רק NaN
        valid_columns = [col for col in data.columns if not data[col].isnull().all()]
        data = data[valid_columns]
        
        # שמירה רק על שמות העמודות הרלוונטיות (הרמה השנייה של MultiIndex)
        data.columns = [col[1] if isinstance(col, tuple) and len(col) > 1 else col for col in data.columns]
    else:
        print("Columns are already flat.")
    
    # בדיקת עמודת Close
    if 'Close' not in data.columns:
        raise KeyError("No valid 'Close' column found in the data.")
    
    return data

# פונקציה לנרמול הנתונים
def normalize_data(data, feature, stock_name=None):
    # בדיקת MultiIndex או מבנה רגיל
    if isinstance(data.columns, pd.MultiIndex):
        # יצירת שם העמודה הדינמי
        feature_column = (feature, stock_name)
        if feature_column in data.columns:
            print(f"Using MultiIndex column: {feature_column}")
        else:
            raise KeyError(f"Column '{feature_column}' not found in MultiIndex columns: {data.columns}")
    else:
        # במידה ואין MultiIndex
        feature_column = feature
        if feature_column in data.columns:
            print(f"Using flat column: {feature_column}")
        else:
            raise KeyError(f"Column '{feature_column}' not found in flat columns: {data.columns}")

    # בדיקת ערכים בעמודה
    if data[feature_column].isnull().all():
        raise ValueError(f"All values in column '{feature_column}' are NaN.")
    
    # נרמול הנתונים
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data[feature_column].values.reshape(-1, 1))
    return scaled_data, scaler

# פונקציה ליצירת רצפים עבור המודל
def create_sequences(data, sequence_length):
    sequences = []
    for i in range(len(data) - sequence_length):
        sequences.append(data[i:i + sequence_length])
    return np.array(sequences)

# פונקציה לבניית מודל LSTM
def build_lstm_model(input_shape):
    model = tf.keras.Sequential([
        tf.keras.layers.LSTM(50, return_sequences=True, input_shape=input_shape),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.LSTM(50, return_sequences=False),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(25),
        tf.keras.layers.Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

# פונקציה לעדכון נתוני מניה
def update_stock_data(stock_name, file_path):
    try:
        # טוען את הנתונים הקיימים
        existing_data = pd.read_csv(file_path, parse_dates=["Date"])
        if "Date" not in existing_data.columns:
            raise KeyError("Column 'Date' is missing in the existing file.")
        existing_data["Date"] = pd.to_datetime(existing_data["Date"]).dt.tz_localize(None)  # הסרת אזור זמן
        existing_data.set_index("Date", inplace=True)
        last_date = existing_data.index.max()  # תאריך אחרון בקובץ
    except FileNotFoundError:
        existing_data = pd.DataFrame()
        last_date = datetime(2020, 1, 1)  # אם אין קובץ, נתחיל מ-2020
    except KeyError as e:
        print(f"Error in existing data for {stock_name}: {e}")
        return

    # תאריך עדכני
    today = datetime.now().strftime('%Y-%m-%d')

    # הורדת נתונים מעודכנים מ-yfinance
    try:
        stock_data = yf.download(stock_name, start=last_date.strftime('%Y-%m-%d'), end=today)
    except Exception as e:
        print(f"Failed to fetch data for {stock_name}: {e}")
        return

    # שמירת הנתונים החדשים
    if not stock_data.empty:
        stock_data = stock_data[["Open", "High", "Low", "Close", "Adj Close", "Volume"]]
        stock_data.index = pd.to_datetime(stock_data.index).tz_localize(None)  # הסרת אזור זמן
        stock_data.sort_index(inplace=True)

        # שילוב הנתונים החדשים בקיימים
        if not existing_data.empty:
            updated_data = pd.concat([existing_data, stock_data])
            updated_data = updated_data[~updated_data.index.duplicated(keep="last")].sort_index()
        else:
            updated_data = stock_data

        # שמירת הנתונים המעודכנים
        updated_data.to_csv(file_path)
        print(f"Data for {stock_name} updated successfully!")
    else:
        print(f"No new data available for {stock_name}.")



# פונקציה לעדכון כל המניות בתיקייה
def update_all_stocks_in_folder(folder_path):
    for file_name in os.listdir(folder_path):
        if file_name.endswith(".csv"):  # בדיקה שמדובר בקובץ CSV
            stock_name = file_name.replace(".csv", "")
            file_path = os.path.join(folder_path, file_name)
            update_stock_data(stock_name, file_path)

# פונקציה להרצת משימות מתוזמנות
def run_scheduled_tasks():
    schedule.every().day.at("00:00").do(update_all_stocks_in_folder, folder_path="data/stocks")  # כל יום בחצות

    while True:
        schedule.run_pending()  # מפעיל את המשימות שזמן הביצוע שלהן הגיע
        time.sleep(1)  # ממתין שנייה לפני הבדיקה הבאה

# Route לחיזוי מחיר מניה
@app.route('/api/predict', methods=['POST'])
def predict_stock():
    data = request.get_json()
    stock_name = data.get('stock_name')
    sequence_length = data.get('sequence_length', 60)

    # טוען את הנתונים
    stock_data = load_stock_data(stock_name)
    if stock_data is None:
        return jsonify({"error": f"Stock data for {stock_name} not found"}), 404
    
    print(f"Loaded stock data for {stock_name}: {stock_data.head(-1)}")  # הדפסת נתונים לדוגמה

    # נרמול הנתונים
    try:
        scaled_data, scaler = normalize_data(stock_data, 'Close', stock_name=stock_name)
        print(f"Scaled data: {scaled_data[:5]}")  # הדפסת חלק מהנתונים המנורמלים
    except KeyError as e:
        print(f"Normalization error: {e}")
        return jsonify({"error": str(e)}), 400

    # יצירת רצפים
    x = create_sequences(scaled_data, sequence_length)
    y = scaled_data[sequence_length:]

    # שינוי ממדים עבור TensorFlow
    x = np.reshape(x, (x.shape[0], x.shape[1], 1))

    # בניית מודל
    model = build_lstm_model((sequence_length, 1))

    # אימון המודל
    model.fit(x, y, epochs=10, batch_size=32, verbose=1)

    # תחזית
    last_sequence = scaled_data[-sequence_length:]
    last_sequence = last_sequence.reshape(1, sequence_length, 1)
    prediction = model.predict(last_sequence)
    predicted_price = scaler.inverse_transform(prediction)[0][0]

    # לפני return jsonify...
    historical_prices = stock_data["Close"][-sequence_length:].tolist()
    historical_dates = stock_data.index[-sequence_length:].strftime('%Y-%m-%d').tolist()

    return jsonify({
        "predicted_price": round(float(predicted_price), 2),
        "historical_data": list(zip(historical_dates, historical_prices))
    })

# נתיב הקובץ
DATA_PATH = "datastocks/sp500_companies.csv"

@app.route('/api/stock-details/<string:stock_name>', methods=['GET'])
def get_stock_details(stock_name):
    try:
        data = pd.read_csv(DATA_PATH)
        stock = data[data['Symbol'] == stock_name.upper()]
        if stock.empty:
            return jsonify({"error": f"No details found for stock: {stock_name}"}), 404

        stock_details = stock.iloc[0].to_dict()
        return jsonify(stock_details)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/suggestions', methods=['GET'])
def get_suggestions():
    query = request.args.get('query', '').upper()
    if not query:
        return jsonify([])
    
    data = pd.read_csv(DATA_PATH)
    suggestions = data[data['Symbol'].str.startswith(query)][['Symbol', 'Longname','Sector']].head(10).to_dict(orient='records')
    return jsonify(suggestions)
 

# 🔑 API Key for Polygon.io (Replace with your own API key)
POLYGON_API_KEY = "QK_TtkEeZYSntEOQwX5YeSfNwhbsYtfd"

@app.route('/api/stock-extended/<string:stock_name>', methods=['GET'])
def get_extended_stock_details(stock_name):
    try:
        print(f"Fetching extended data for stock: {stock_name}")

        def fetch_json(url):
            """פונקציה בטוחה לשליפת JSON מה-API"""
            response = requests.get(url)
            try:
                return response.json()
            except ValueError:
                print(f"⚠️ Warning: Invalid JSON response from {url}")
                return None  # מחזיר None אם JSON לא תקף

        # 📌 1. 52-Week High & Low
        high_low_url = f"https://api.polygon.io/v2/aggs/ticker/{stock_name}/range/1/day/2023-02-20/2024-02-20?apiKey={POLYGON_API_KEY}"
        high_low_data = fetch_json(high_low_url)

        if high_low_data and "results" in high_low_data:
            high_52w = max([item.get("h", 0) for item in high_low_data["results"]])
            low_52w = min([item.get("l", 0) for item in high_low_data["results"]])
        else:
            high_52w, low_52w = "N/A", "N/A"

        # 📌 2. Market Trend Data (e.g., SMA, volatility)
        volatility_url = f"https://api.polygon.io/v2/reference/technical_indicators/volatility/{stock_name}?apiKey={POLYGON_API_KEY}"
        volatility_data = fetch_json(volatility_url)
        volatility = volatility_data.get("volatility", "N/A") if volatility_data else "N/A"

        # 📌 3. Earnings Date
        earnings_url = f"https://api.polygon.io/vX/reference/earnings?ticker={stock_name}&apiKey={POLYGON_API_KEY}"
        earnings_data = fetch_json(earnings_url)
        earnings_date = earnings_data["results"][0]["reportDate"] if earnings_data and "results" in earnings_data else "N/A"

        # 🔹 Compile all data into a response
        stock_extended_details = {
            "symbol": stock_name.upper(),
            "high_52w": high_52w,
            "low_52w": low_52w,
            "volatility": volatility,
            "earnings_date": earnings_date,
            "market_trend": "Uptrend" if high_52w != "N/A" and high_52w > low_52w else "Downtrend"
        }

        return jsonify(stock_extended_details)

    except Exception as e:
        print(f"⚠️ Server Error: {e}")
        return jsonify({"error": str(e)}), 500

   
if __name__ == '__main__':
    # הפעלת עדכון מיידי של כל המניות
    #print("Starting initial update of all stocks...")
    #update_all_stocks_in_folder("data/stocks")

    # הפעלת עדכון הנתונים ברקע
    update_thread = Thread(target=run_scheduled_tasks)
    update_thread.daemon = True
    update_thread.start()

    # הפעלת Flask
    app.run(port=5658, debug=True)

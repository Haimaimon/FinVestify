import React, { useState } from "react";
import axios from "axios";
import StockChart from "./StockChart";
import { TextField} from '@mui/material';

const SentimentAnalysis = () => {
  const [stockName, setStockName] = useState("");
  const [result, setResult] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/historical-sentiment", {
        stock_name: stockName,
      });

      console.log("Full API Response:", response.data);

      if (!response.data || !response.data.price_data) {
        console.error("Error: price_data is undefined or empty in response:", response.data);
        return;
      }

      // מיפוי ומיון נתונים
    const chartData = response.data.price_data
    .map((point) => ({
      time: new Date(point.BusinessDay.year, point.BusinessDay.month - 1, point.BusinessDay.day).getTime() / 1000, // UNIX timestamp
      Close: point.Close,
      Indicator: point.Indicator || null,
      priceChange: isNaN(point.Price_Change) ? null : point.Price_Change,
    }))
    .filter((point) => point.time) // סינון ערכים לא חוקיים
    .sort((a, b) => a.time - b.time); // מיון בסדר עולה לפי UNIX timestamp

      console.log("Mapped Chart Data:", chartData);

      setResult(response.data);
      setChartData(chartData);
    } catch (error) {
      console.error("Error fetching sentiment analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sentiment-container">
      <header>
        <h1>📊 Historical Sentiment Analysis</h1>
      </header>
      <div className="input-container">
        <TextField
          type="text"
          placeholder="Enter stock name (e.g., AAPL)"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
        />
        <button onClick={fetchAnalysis} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
      {result && (
        <div className="result-container">
          <h2>Results for {stockName}</h2>
          <p>📈 Positive success rate: {result.positive_success_rate ? result.positive_success_rate.toFixed(2) : "N/A"}%</p>
          <p>📉 Negative success rate: {result.negative_success_rate ? result.negative_success_rate.toFixed(2) : "N/A"}%</p>
          <p>📅 Total analyzed days: {result.total_analyzed_days}</p>
          <StockChart data={chartData} stockName={stockName} />
          <h3>📰 Related News and Sentiment:</h3>
          {result.news_articles.map((article, index) => (
            <div key={index} className="news-item">
              <h4>{article.Headline}</h4>
              <p>
                Sentiment: {article.Sentiment} ({(article.Confidence * 100).toFixed(2)}%)
              </p>
              <small>Date: {article.Date}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;

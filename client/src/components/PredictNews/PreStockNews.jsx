import React, { useState } from "react";
import axios from "axios";
import "./Pre.css";

const PreStockNews = () => {
  const [stockName, setStockName] = useState("");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/stock-news", { stock_name: stockName });
      setNews(response.data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-container">
      <header>
        <h1>📈 Stock News Sentiment Analysis</h1>
      </header>
      <div className="input-container">
        <input
          type="text"
          placeholder="Enter stock name (e.g., AAPL)"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
        />
        <button onClick={fetchNews} disabled={loading}>
          {loading ? "Fetching..." : "Analyze News"}
        </button>
      </div>
      {news.length > 0 && (
        <div className="news-list">
          <h2>News for {stockName}</h2>
          {news.map((item, index) => (
            <div key={index} className="news-item">
              <div className="news-header">
                <h3>{item.headline}</h3>
                <span className={`sentiment sentiment-${item.sentiment.toLowerCase()}`}>
                  {item.sentiment === "POSITIVE" && "👍"}
                  {item.sentiment === "NEGATIVE" && "👎"}
                  {item.sentiment === "NEUTRAL" && "🤔"}{" "}
                  ({(item.confidence * 100).toFixed(2)}%)
                </span>
              </div>
              <p>{item.content}</p>
              <p>
                <strong>Impact:</strong> {item.impact}
              </p>
              <small>Published at: {new Date(item.published_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreStockNews;

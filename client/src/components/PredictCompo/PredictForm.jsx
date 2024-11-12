import React, { useState } from 'react';
import axios from '../../features/axiosConfig';

function PredictForm({ onPrediction }) {
  const [ticker, setTicker] = useState('');
  const [interval, setInterval] = useState('1d');
  const [timesteps, setTimesteps] = useState(60);
  const [loading, setLoading] = useState(false); // Loading state

  const handlePredict = async (e) => {
    e.preventDefault();
  
    if (!ticker || !interval || timesteps < 1 || timesteps > 100) {
      alert("Please provide valid ticker, interval, and timestep values.");
      return;
    }
  
    try {
      const response = await axios.get(`http://localhost:5000/api/predict/${ticker}`, {
        params: { interval, timesteps },
      });
      console.log("sad")
      onPrediction(response.data);
    } catch (error) {
      console.error("Prediction Error:", error);
  
      if (error.response && error.response.data) {
        alert(`Error: ${error.response.data.error || "Request failed."}`);
      } else {
        alert("Failed to retrieve prediction. Please try again.");
      }
    }
  };
  

  return (
    <form onSubmit={handlePredict} className="predict-form">
      <div>
        <label>Ticker:</label>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          required
          placeholder="e.g., AAPL"
        />
      </div>
      <div>
        <label>Interval:</label>
        <select value={interval} onChange={(e) => setInterval(e.target.value)}>
          <option value="1d">1 Day</option>
          <option value="5m">5 Minutes</option>
          <option value="15m">15 Minutes</option>
          <option value="1wk">1 Week</option>
          <option value="1mo">1 Month</option>
        </select>
      </div>
      <div>
        <label>Timesteps:</label>
        <input
          type="number"
          value={timesteps}
          onChange={(e) => setTimesteps(Math.min(Math.max(e.target.value, 1), 100))}
          min="1"
          max="100"
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Predicting..." : "Predict"}
      </button>
    </form>
  );
}

export default PredictForm;

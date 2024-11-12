import React from 'react';

function PredictionDisplay({ prediction }) {
  if (!prediction) return null;

  return (
    <div className="prediction-result">
      <h3>Prediction Result</h3>
      <p><strong>Ticker:</strong> {prediction.ticker}</p>
      <p><strong>Interval:</strong> {prediction.interval}</p>
      <p><strong>Predicted Close Price:</strong> ${prediction.predicted_close.toFixed(2)}</p>
    </div>
  );
}

export default PredictionDisplay;

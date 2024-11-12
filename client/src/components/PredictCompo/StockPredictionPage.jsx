import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Typography, CircularProgress, Box } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import StockChart from './StockChartPre';

function StockPredictionPage() {
  const [ticker, setTicker] = useState('');
  const [interval, setInterval] = useState('1d');
  const [period, setPeriod] = useState('1y');
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    setPredictedPrice(null);

    try {
      const response = await axios.get(`http://localhost:5000/api/predict_stock`, {
        params: { ticker, interval, period },
      });
      setPredictedPrice(response.data.predicted_price);
      toast.success(`Predicted price for ${ticker} is $${response.data.predicted_price.toFixed(2)}`);
    } catch (error) {
      console.error('Prediction Error:', error);
      toast.error(`Error: ${error.response?.data.error || 'Prediction failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '500px', margin: 'auto', padding: '20px', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>Stock Price Prediction</Typography>
      
      <TextField
        label="Ticker Symbol"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        fullWidth
        margin="normal"
      />
      
      <TextField
        label="Interval"
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
        select
        fullWidth
        margin="normal"
        SelectProps={{ native: true }}
      >
        <option value="1d">1 Day</option>
        <option value="5m">5 Minutes</option>
        <option value="15m">15 Minutes</option>
        <option value="1wk">1 Week</option>
        <option value="1mo">1 Month</option>
      </TextField>
      <TextField
        label="Period"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        select
        fullWidth
        margin="normal"
        SelectProps={{ native: true }}
      >
        <option value="1y">1 Year</option>
        <option value="60d">60 Days</option>
      </TextField>

      <Button
        variant="contained"
        color="primary"
        onClick={handlePredict}
        disabled={loading || !ticker}
        sx={{ marginTop: '20px' }}
      >
        Predict Price
      </Button>

      {loading && <CircularProgress sx={{ marginTop: '20px' }} />}
      {predictedPrice !== null && (
        <StockChart ticker={ticker} predictedPrice={predictedPrice} />
      )}

      <ToastContainer />
    </Box>
  );
}

export default StockPredictionPage;

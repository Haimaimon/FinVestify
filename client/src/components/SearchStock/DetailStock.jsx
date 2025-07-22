import React, { useState, useEffect } from 'react';
import { fetchStockData } from './stockService'; // קריאה לשרת
import { Box, Card, CardContent, Typography, CircularProgress, Grid } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';


const DetailStock = ({ stockName }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (stockName) {
      getExtendedStockDetails(stockName);
    }
  }, [stockName]);

  const getExtendedStockDetails = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockData(name);
      setStockData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading stock data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, color: 'red' }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  return stockData ? (
    <Box sx={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <Card sx={{ backgroundColor: '#d68a8a', p: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            {stockData.symbol} - Extended Data
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2"><TrendingUpIcon sx={{ mr: 1, color: '#4caf50' }} /> Market Trend: {stockData.market_trend || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><BarChartIcon sx={{ mr: 1, color: '#ff9800' }} /> 52 Week High: {stockData.high_52w || 'N/A'}$</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><ShowChartIcon sx={{ mr: 1, color: '#2196f3' }} /> 52 Week Low: {stockData.low_52w || 'N/A'}$</Typography>
            </Grid>
          </Grid>  
        </CardContent>
      </Card>
    </Box>
  ) : null;
};

export default DetailStock;

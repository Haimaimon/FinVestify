import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Card, CardContent, Typography, CircularProgress, Grid } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PeopleIcon from '@mui/icons-material/People';

const SearchStocks = () => {
  const [searchParams] = useSearchParams();
  const [stockDetails, setStockDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stockName = searchParams.get('query');

  useEffect(() => {
    if (stockName) {
      fetchStockDetails(stockName);
    }
  }, [stockName]);

  const fetchStockDetails = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5658/api/stock-details/${name}`);
      setStockDetails(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch stock details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading stock details...
        </Typography>
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

  return stockDetails ? (
    <Box sx={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <Card sx={{ backgroundColor: '#e3f2fd', p: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            {stockDetails.Longname || stockDetails.Symbol}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1, color: '#4caf50' }} />
                Sector: {stockDetails.Sector || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon sx={{ mr: 1, color: '#ff9800' }} />
                Current Price: ${stockDetails.Currentprice || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationCityIcon sx={{ mr: 1, color: '#2196f3' }} />
                Location: {stockDetails.City}, {stockDetails.State}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1, color: '#f44336' }} />
                Employees: {stockDetails.Fulltimeemployees || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  ) : (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h6">No stock details available</Typography>
    </Box>
  );
};

export default SearchStocks;

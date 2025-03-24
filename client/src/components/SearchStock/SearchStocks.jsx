import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchStockDetails } from './stockService'; // קריאה לשרת
import { Box, Card, CardContent, Typography, CircularProgress, Grid } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PeopleIcon from '@mui/icons-material/People';
import DetailStock from './DetailStock';
import StockChart from '../Favorites/StockChart';

const SearchStocks = () => {
  const [searchParams] = useSearchParams();
  const [stockDetails, setStockDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stockName = searchParams.get('query');

  useEffect(() => {
    if (stockName) {
      getStockDetails(stockName);
    }
  }, [stockName]);

  const getStockDetails = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockDetails(name);
      setStockDetails(data);
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
        <Typography variant="body1" sx={{ mt: 2 }}>Loading stock details...</Typography>
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
    <Box>
      <Box sx={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
        <Card sx={{ backgroundColor: '#e3f2fd', p: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              {stockDetails.Longname || stockDetails.Symbol}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <BusinessIcon sx={{ mr: 1, color: '#4caf50' }} /> Sector: {stockDetails.Sector || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <AttachMoneyIcon sx={{ mr: 1, color: '#ff9800' }} /> Current Price: ${stockDetails.Currentprice || 'N/A'}
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

      {/* קריאה לקובץ החדש שמציג מידע נוסף */}
      <DetailStock stockName={stockDetails.Symbol} />

      {/* קריאה לקובץ החדש שמציג גרף */}
      <Box sx={{ mt: 4 , textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 4 }}>Stock Chart: {stockDetails.Symbol}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <StockChart ticker={stockDetails.Symbol} />
        </Box>      
      </Box>  
    </Box>
  ) : (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h6">No stock details available</Typography>
    </Box>
  );
};

export default SearchStocks;
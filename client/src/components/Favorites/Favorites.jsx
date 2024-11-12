import React, { useEffect, useState } from 'react';
import axios from '../../features/axiosConfig';
import { Delete } from '@material-ui/icons';
import { Typography, IconButton } from '@material-ui/core';
import './Favorites.css';
import StockChart from './StockChart';


function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get('/portfolio/favorites');
        setFavorites(response.data);
      } catch (error) {
        console.error('Error fetching favorite stocks:', error);
      }
    };
    fetchFavorites();
  }, []);

  // Fetch latest stock data every second
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const updatedFavorites = await Promise.all(
          favorites.map(async (stock) => {
            const response = await axios.get(`/portfolio/stock/${stock.ticker}`);
            return {
              ...stock,
              closePrice: response.data.closePrice,
              change: response.data.change, // Calculate change here if needed
            };
          })
        );
        setFavorites(updatedFavorites);
      } catch (error) {
        console.error('Error updating stock prices:', error);
      }
    }, 1000); // 1 second interval

    return () => clearInterval(intervalId); // Clear interval on unmount
  }, [favorites]);

  const handleRemoveFavorite = async (ticker) => {
    try {
      await axios.delete(`/portfolio/favorites/${ticker}`);
      setFavorites(favorites.filter(stock => stock.ticker !== ticker));
      if (selectedStock === ticker) setSelectedStock(null); // Deselect if removed
    } catch (error) {
      console.error('Error removing favorite stock:', error);
    }
  };

  return (
    <div className="favorites-container">
      {favorites.length === 0 ? (
        <Typography variant="h6">No favorites added yet</Typography>
      ) : (
        favorites.map((stock) => (
          <div className="stock-card" key={stock.ticker}>
            <div className="card-header">
              <Typography variant="h5" key={stock.ticker} onClick={() => setSelectedStock(stock.ticker)} >{stock.ticker}</Typography>
              <IconButton className="remove-button" onClick={() => handleRemoveFavorite(stock.ticker)}>
                <Delete />
              </IconButton>
            </div>
            <div className="price-info">
              <Typography variant="body1">Last Close: ${stock.closePrice}</Typography>
              <Typography
                variant="body1"
                className={stock.change >= 0 ? 'change-positive' : 'change-negative'}
              >
                Change: {stock.change >= 0 ? `+${stock.change}%` : `${stock.change}%`}
              </Typography>
            </div>
          </div>
        ))
      )}
        {/* Only render one StockChart component */}
        {selectedStock && <StockChart key={selectedStock} ticker={selectedStock} />}    
    </div>
  );
}

export default Favorites;

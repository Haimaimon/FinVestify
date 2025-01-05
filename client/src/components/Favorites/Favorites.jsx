import React, { useEffect, useState, useRef } from "react";
import axios from "../../features/axiosConfig";
import { Delete } from "@material-ui/icons";
import { Typography, IconButton } from "@material-ui/core";
import "./Favorites.css";
import StockChart from "./StockChart";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const favoritesRef = useRef([]);

  // Fetch initial favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get("/portfolio/favorites");
        setFavorites(response.data);
        favoritesRef.current = response.data; // Update ref
      } catch (error) {
        console.error("Error fetching favorite stocks:", error);
      }
    };
    fetchFavorites();
  }, []);

  // Fetch stock prices every second
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const updatedFavorites = await Promise.all(
          favoritesRef.current.map(async (stock) => {
            const response = await axios.get(`/portfolio/stock/${stock.ticker}`);
            return {
              ...stock,
              closePrice: response.data.closePrice,
              change: response.data.change,
            };
          })
        );
        setFavorites(updatedFavorites);
      } catch (error) {
        console.error("Error updating stock prices:", error);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleRemoveFavorite = async (ticker) => {
    try {
      await axios.delete(`/portfolio/favorites/${ticker}`);
      const updatedFavorites = favoritesRef.current.filter(
        (stock) => stock.ticker !== ticker
      );
      setFavorites(updatedFavorites);
      favoritesRef.current = updatedFavorites; // Update ref
      if (selectedStock === ticker) setSelectedStock(null);
    } catch (error) {
      console.error("Error removing favorite stock:", error);
    }
  };

  const handleSelectStock = (ticker) => {
    if (selectedStock === ticker) {
      setSelectedStock(null);
    } else {
      setSelectedStock(null);
      setTimeout(() => setSelectedStock(ticker), 0);
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
              <Typography
                variant="h5"
                onClick={() => handleSelectStock(stock.ticker)}
              >
                {stock.ticker}
              </Typography>
              <IconButton
                className="remove-button"
                onClick={() => handleRemoveFavorite(stock.ticker)}
              >
                <Delete />
              </IconButton>
            </div>
            <div className="price-info">
              <Typography variant="body1">
                Last Close: ${stock.closePrice}
              </Typography>
              <Typography
                variant="body1"
                className={
                  stock.change >= 0 ? "change-positive" : "change-negative"
                }
              >
                Change: {stock.change >= 0
                  ? `+${stock.change}%`
                  : `${stock.change}%`}
              </Typography>
            </div>
          </div>
        ))
      )}
      {selectedStock && <StockChart key={selectedStock} ticker={selectedStock} />}
    </div>
  );
}

export default Favorites;

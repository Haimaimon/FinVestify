import React, { useState, useEffect } from 'react';
import axios from '../../features/axiosConfig';
import { Favorite, FavoriteBorder } from '@material-ui/icons';
import IconButton from '@material-ui/core/IconButton';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function FavoriteButton({ ticker }) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch current favorite status when ticker changes
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      try {
        const response = await axios.get(`/portfolio/favorites/${ticker}`);
        setIsFavorite(response.data.isFavorite);
      } catch (error) {
        console.error('Error fetching favorite status:', error);
        setIsFavorite(false); // Reset if there’s an error
      }
    };
    fetchFavoriteStatus();
  }, [ticker]);

  const handleFavoriteToggle = async () => {
    try {
      if (isFavorite) {
        await axios.delete(`/portfolio/favorites/${ticker}`);
        toast.success(`${ticker} removed from facorites`);
      } else {
        await axios.post(`/portfolio/favorite`, { ticker });
        toast.success(`${ticker} added to favorites`);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  };

  return (
    <div>
      <IconButton onClick={handleFavoriteToggle} aria-label="add to favorites">
        {isFavorite ? <Favorite color="secondary" /> : <FavoriteBorder />}
      </IconButton>
    </div>
  );
}

export default FavoriteButton;

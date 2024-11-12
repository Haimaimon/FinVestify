import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../../features/axiosConfig';
import { TextField, Button, CircularProgress, Card, CardContent, Typography } from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../Menu/StockDataStyles.css'

const StockNews = ({ ticker }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['news', ticker, startDate, endDate],
    queryFn: () =>
      axios.get(`/news`, {
        params: { ticker, startDate, endDate },
      }),
    enabled: false, // Only refetch when requested
  });

  const fetchNews = () => {
    refetch();
  };

  // Carousel settings for one item per slide
  const settings = {
    dots: true,           // Show navigation dots
    infinite: true,       // Enable infinite loop
    speed: 500,           // Transition speed between slides
    slidesToShow: 1,      // Only show 1 slide at a time
    slidesToScroll: 1,    // Scroll through 1 slide at a time
    autoplay: false,      // Disable autoplay so user can manually control
    arrows: true,         // Navigation arrows for users
    adaptiveHeight: true, // Adjust height based on the current slide content
  };

  return (
    <div className="stock-news-container">
      <Typography variant="h5" gutterBottom>{`News for ${ticker}`}</Typography>

      <div className="date-inputs">
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </div>

      <Button variant="contained" color="primary" onClick={fetchNews}>
        Get News
      </Button>

      {isLoading && <CircularProgress style={{ marginTop: '20px' }} />}
      {error && <Typography color="error" style={{ marginTop: '20px' }}>Error fetching news</Typography>}

      <div className="news-carousel">
        {data?.data?.length > 0 ? (
          <Slider {...settings}>
            {data.data.map((article, index) => (
              <div key={index}>
                <Card className="news-card">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        {article.title}
                      </a>
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {new Date(article.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1">{article.description}</Typography>
                  </CardContent>
                </Card>
              </div>
            ))}
          </Slider>
        ) : (
          <Typography variant="body2" color="textSecondary" style={{ marginTop: '20px' }}>
            No news available for this date range.
          </Typography>
        )}
      </div>
    </div>
  );
};

export default StockNews;

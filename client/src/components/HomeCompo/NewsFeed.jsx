// components/NewsFeed.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchNews = async () => {
  const { data } = await axios.get('https://newsapi.org/v2/top-headlines', {
    params: { country: 'us', category: 'business', apiKey: '941c905a04a24e6c8edee618209cf60e' },
  });
  return data.articles.slice(0, 5); // 5 כתבות בלבד
};

function NewsFeed() {
    const { data: news, isLoading, error } = useQuery({
      queryKey: ['news'],
      queryFn: fetchNews,
    });
  
    if (isLoading) return <div>Loading news...</div>;
    if (error) return <div>Error loading news</div>;
  
    return (
      <div className="news-feed">
        <h2>Latest US Business News</h2>
        {news.map((article, index) => (
          <div key={index} className="news-article">
            <h3>{article.title}</h3>
            <p>{article.description}</p>
          </div>
        ))}
      </div>
    );
  }
  
  export default NewsFeed;

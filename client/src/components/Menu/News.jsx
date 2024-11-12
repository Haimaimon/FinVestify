import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchNews = async () => {

  const response = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      q: 'stock market',
      sortBy: 'popularity',
      apiKey: "941c905a04a24e6c8edee618209cf60e",
    },
  });
  return response.data.articles;
};


const News = () => {

  const { data, error, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
    refetchInterval: 1800000, // 30 דקות במיליסקנדות
  });

  if (isLoading) return <div>Loading news...</div>;
  if (error) return <div>Error fetching news</div>;

  // סינון ל-10 תוצאות בלבד
  const filteredArticles = data.slice(0, 10);

  return (
    <div className="news-container">
      {filteredArticles.map((article, index) => (
        <div key={index} className="news-card">
          <h3>{article.title}</h3>
          <p>{article.description}</p>
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            Read more
          </a>
        </div>
      ))}
    </div>
  );
};

export default News;

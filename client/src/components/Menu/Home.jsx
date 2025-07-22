import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../features/axiosConfig';
import NewsFeed from '../HomeCompo/NewsFeed';
import PortfolioSummary from '../HomeCompo/PortfolioSummary';
import './Home.css';
import { useEffect } from 'react';

const fetchPortfolioPerformance = async () => {
  const { data } = await axios.get('/portfolio/performance');
  return data;
};

function Home({ isLoggedIn }) {
  const queryClient = useQueryClient();

  const { data: portfolioPerformance, isLoading, error } = useQuery({
    queryKey: ['portfolioPerformance'],
    queryFn: fetchPortfolioPerformance,
    enabled: isLoggedIn, // מבצע את הקריאה רק אם המשתמש מחובר
  });

  useEffect(() => {
    if (!isLoggedIn) {
      queryClient.removeQueries(['portfolioPerformance']);
    }
  }, [isLoggedIn, queryClient]);

  if (isLoading) return <div>Loading portfolio...</div>;
  if (error) return <div>Error loading portfolio data.</div>;

  return (
    <div className="home-container">
      <div className="news-section">
        <NewsFeed />
      </div>

      {isLoggedIn && portfolioPerformance ? (
        <div className="portfolio-section">
          <PortfolioSummary 
            balance={portfolioPerformance.cash_balance} 
            dailyPerformance={portfolioPerformance.dailyPerformance || []} 
            weeklyPerformance={portfolioPerformance.weeklyPerformance || []} 
            monthlyPerformance={portfolioPerformance.monthlyPerformance || []} 
            dailyLabels={portfolioPerformance.dailyLabels || []} 
            weeklyLabels={portfolioPerformance.weeklyLabels || []} 
            monthlyLabels={portfolioPerformance.monthlyLabels || []} 
          />
        </div>
      ) : (
        <div className="login-message">
          <h2>Please log in to see your portfolio</h2>
        </div>
      )}
    </div>
  );
}

export default Home;

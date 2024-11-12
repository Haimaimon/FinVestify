import { useQuery } from '@tanstack/react-query';
import axios from '../../features/axiosConfig';
import NewsFeed from '../HomeCompo/NewsFeed';
import PortfolioSummary from '../HomeCompo/PortfolioSummary';
import './Home.css';
import { useEffect, useState } from 'react';


const checkIsLoggedIn = () => {
  const token = localStorage.getItem('tokenim');
  return !!token; // מחזיר true אם יש טוקן, אחרת false
};

const fetchPortfolioPerformance = async () => {
  const { data } = await axios.get('/portfolio/performance');
  return data;
};

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(checkIsLoggedIn());
  }, []);

  const { data: portfolioPerformance, isLoading, error } = useQuery({
    queryKey: ['portfolioPerformance'],
    queryFn: fetchPortfolioPerformance,
    enabled: isLoggedIn, // מבצע את הקריאה רק אם המשתמש מחובר
  });

  if (isLoading) return <div>Loading portfolio...</div>;
  if (error) return <div>Error loading portfolio data.</div>;

  return (
    <div className="home-container">
      {/* חדשות פיננסיות */}
      <div className="news-section">
        <h2>Latest Financial News</h2>
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

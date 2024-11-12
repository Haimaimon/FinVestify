import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockChartPre = ({ ticker, predictedPrice }) => {
    const [chartData, setChartData] = useState(null);
  
    useEffect(() => {
      const fetchHistoricalData = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/stock/${ticker}`, {
            params: {
              period: '1y',
              interval: '1d',
            },
          });
  
          const dates = response.data.dates;
          const prices = response.data.prices;
  
          // הוספת תאריך נוסף לחיזוי אחרי התאריך האחרון הקיים
          const extendedDates = [...dates, "Predicted"];
  
          // יצירת מערך המחירים עם חיזוי
          const closePrices = prices;
          const predictedPrices = [...Array(closePrices.length - 1).fill(null), closePrices[closePrices.length - 1], predictedPrice];
  
          setChartData({
            labels: extendedDates,
            datasets: [
              {
                label: `${ticker} - Closing Prices`,
                data: closePrices,
                borderColor: 'blue',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
              },
              {
                label: 'Predicted Price',
                data: predictedPrices,
                borderColor: 'red',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
              },
            ],
          });
        } catch (error) {
          toast.error('Error fetching historical data');
          console.error('Error fetching historical data:', error);
        }
      };
  
      fetchHistoricalData();
    }, [ticker, predictedPrice]);
  
    return (
      <div>
        {chartData ? (
          <Line data={chartData} />
        ) : (
          <p>Loading chart...</p>
        )}
      </div>
    );
  };
  

export default StockChartPre;

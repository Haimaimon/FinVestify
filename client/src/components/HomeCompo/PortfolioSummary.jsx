// PortfolioSummary.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';

// רישום הסקאלות והקומפוננטים הנדרשים
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

function PortfolioSummary({ balance, dailyPerformance = [], weeklyPerformance = [], monthlyPerformance = [], dailyLabels = [], weeklyLabels = [], monthlyLabels = [] }) {

  // וידוא שהביצועים אינם undefined או ריקים
  const validatedDailyPerformance = dailyPerformance.length ? dailyPerformance : [0, 0, 0, 0];
  const validatedWeeklyPerformance = weeklyPerformance.length ? weeklyPerformance : [0, 0, 0, 0];
  const validatedMonthlyPerformance = monthlyPerformance.length ? monthlyPerformance : [0, 0, 0, 0];

  const chartData = {
    labels: dailyLabels.length ? dailyLabels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'], // ימי השבוע
    datasets: [
      {
        label: 'Daily Performance',
        data: validatedDailyPerformance,
        borderColor: 'red',
        fill: false,
      },
      {
        label: 'Weekly Performance',
        data: validatedWeeklyPerformance,
        borderColor: 'green',
        fill: false,
      },
      {
        label: 'Monthly Performance',
        data: validatedMonthlyPerformance,
        borderColor: 'blue',
        fill: false,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time Period',
        },
      },
      y: {
        beginAtZero: false,
        min: -2000, // הגדר מינימום לפי הצרכים שלך
        max: 15000, // הגדר מקסימום לפי הצרכים שלך
        title: {
          display: true,
          text: 'Performance',
        },
      },
    },
  };

  return (
    <div className="portfolio-summary">
      <h2>Your Portfolio</h2>
      <p>Balance: ${balance}</p>
      <Line data={chartData} options={options} />
    </div>
  );
}

export default PortfolioSummary;

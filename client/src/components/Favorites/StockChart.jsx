import React, { useEffect, useState, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import axios from '../../features/axiosConfig';

function StockChart({ ticker }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(null); // Keep a reference to the chart instance
  const candleSeriesRef = useRef(null); // Reference for the candle series
  const [latestPrice, setLatestPrice] = useState(null);
  const lastCandleRef = useRef(null);

  useEffect(() => {
    // ננקה את הגרף הקודם, אם קיים
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    }
  
    // יצירת הגרף והנתונים מחדש
    const chart = createChart(chartContainerRef.current, { width: 600, height: 400 });
    chartRef.current = chart; // שמירה על הרפרנס של הגרף החדש
    const candleSeries = chart.addCandlestickSeries();
    candleSeriesRef.current = candleSeries;
  
    const fetchHistoricalData = async () => {
      try {
        const response = await axios.get(`/portfolio/stock/${ticker}`);
        const candlestickData = response.data.prices.map(d => ({
          time: d.date.split('T')[0],
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        candleSeries.setData(candlestickData);
        lastCandleRef.current = candlestickData[candlestickData.length - 1];
      } catch (error) {
        console.error('Error loading historical data:', error);
      }
    };
  
    fetchHistoricalData();
  
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(`/portfolio/stock/${ticker}/latest`);
        const newPrice = response.data.currentPrice;
        setLatestPrice(newPrice);
  
        if (lastCandleRef.current) {
          const updatedCandle = {
            ...lastCandleRef.current,
            close: newPrice,
            high: Math.max(lastCandleRef.current.high, newPrice),
            low: Math.min(lastCandleRef.current.low, newPrice),
          };
          candleSeries.update(updatedCandle);
          lastCandleRef.current = updatedCandle;
        }
      } catch (error) {
        console.error('Error fetching latest price:', error);
      }
    }, 200);
  
    return () => {
      clearInterval(intervalId);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [ticker]);
  
  return (
    <div>
      <div ref={chartContainerRef}></div>
    </div>
  );
}

export default StockChart;

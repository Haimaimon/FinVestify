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
    // Clean up any existing chart instance before creating a new one
    if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
      }

    // Initialize the chart
    const chart = createChart(chartContainerRef.current, { width: 600, height: 400 });
    const candleSeries = chart.addCandlestickSeries();

    // Fetch historical data and initialize chart
    const fetchHistoricalData = async () => {
      try {
        const response = await axios.get(`/portfolio/stock/${ticker}`);
        const candlestickData = response.data.prices.map(d => ({
          time: d.date.split('T')[0],  // Only take yyyy-mm-dd part
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        candleSeries.setData(candlestickData);

        // Store the last candle data to update it in real-time
        lastCandleRef.current = candlestickData[candlestickData.length - 1];
      } catch (error) {
        console.error('Error loading historical data:', error);
      }
    };

    fetchHistoricalData();

    // Update latest price and adjust the last candlestick every second
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(`/portfolio/stock/${ticker}/latest`);
        const newPrice = response.data.currentPrice;
        setLatestPrice(newPrice);

        // Update the current candlestick
        if (lastCandleRef.current) {
          const updatedCandle = {
            ...lastCandleRef.current,
            close: newPrice,
            high: Math.max(lastCandleRef.current.high, newPrice),
            low: Math.min(lastCandleRef.current.low, newPrice),
          };
          candleSeries.update(updatedCandle);
          lastCandleRef.current = updatedCandle;  // Keep track of the updated last candle
        }
      } catch (error) {
        console.error('Error fetching latest price:', error);
      }
    }, 1000);

    return () => {
      // Clean up interval and chart on unmount
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

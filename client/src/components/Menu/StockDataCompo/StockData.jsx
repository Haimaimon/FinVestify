import React, { useEffect, useRef, useState } from 'react';
import axios from '../../../features/axiosConfig';
import { createChart } from 'lightweight-charts';
import { TextField, Button, InputLabel, Select, MenuItem } from "@mui/material";
import {  toast } from 'react-toastify';
import { TrendingUp, TrendingDown, ShoppingCart, Close } from '@mui/icons-material';
import 'react-toastify/dist/ReactToastify.css';
import PriceAlert from './PriceAlert';
import './StockDataStyles.css';
import StockNews from './StockNews';
import FavoriteButton from './FavoriteButton';

function StockData() {

  const [quantity, setQuantity] = useState(''); // שמור את הכמות ב-state
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const movingAverageSeriesRef = useRef([]); // מחזיק סדרות ממוצע נע
  const [chartData, setChartData] = useState([]);
  const tooltipRef = useRef();
  const [ticker, setTicker] = useState('AAPL');
  const [candleSize, setCandleSize] = useState('1d');
  const [movingAverages, setMovingAverages] = useState([]);
  const [selectedIndicator, setSelectedIndicator] = useState('none');
  const [isTradePopupOpen, setIsTradePopupOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null); // אתחול currentPosition
  const [portfolio, setPortfolio] = useState(null); // הגדרת משתנה פורטפוליו
  const [transactions, setTransactions] = useState([]);


  useEffect(() => {
    chartRef.current = createChart(chartContainerRef.current, { width: 1200, height: 600 });
    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries();

    // יצירת ה-tooltip
    tooltipRef.current = document.createElement('div');
    tooltipRef.current.style.position = 'absolute';
    tooltipRef.current.style.display = 'none';
    tooltipRef.current.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    tooltipRef.current.style.color = 'white';
    tooltipRef.current.style.padding = '5px';
    tooltipRef.current.style.borderRadius = '5px';
    tooltipRef.current.style.pointerEvents = 'none';
    tooltipRef.current.style.zIndex = '10';
    chartContainerRef.current.appendChild(tooltipRef.current);

    return () => chartRef.current.remove();
  }, []);

  //const formatDateForChart = (date) => {
    //const d = new Date(date);
    //return {
     // year: d.getUTCFullYear(),
      //month: d.getUTCMonth() + 1, // כי זה 0-based
      //day: d.getUTCDate(),
    //};
  //};

  useEffect(() => {
    // בקשה לנתוני הפורטפוליו מהשרת
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get('/portfolio');
        setPortfolio(response.data);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      }
    };

    fetchPortfolio();
  }, []);

  useEffect(() => {
    const getRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };
  
    const fetchData = async () => {
      console.log(`Fetching stock data for: ${ticker} with interval: ${candleSize}`);
      console.log("✅ Moving Averages Periods:", movingAverages);

      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/stock/${ticker}`, {
          params: { interval: candleSize }
        });
        console.log("API Response:", response.data);

        // בדיקת נתונים שהגיעו מהשרת
        if (!response.data.dates || response.data.dates.length === 0) {
          toast.error(`No data found for ${ticker} with interval ${candleSize}`);
          setChartData([]);
          return;
        }

        const { dates, open, high, low, prices } = response.data;
        const chartData = dates.map((timestamp, index) => ({
          time: timestamp / 1000, // ממיר למספר שניות
          open: open[index],
          high: high[index], 
          low: low[index],
          close: prices[index]
        })).sort((a, b) => a.time - b.time);
        
        /*
        const chartData = dates.map((date, index) => ({
          time: new Date(date).getTime() / 1000,
          open: open[index],
          high: high[index],
          low: low[index],
          close: prices[index]
        })).filter((data, index, self) =>
          index === self.findIndex((t) => t.time === data.time)
        ).sort((a, b) => a.time - b.time);
        */
        setChartData(chartData);
        candlestickSeriesRef.current.setData(chartData);

        // מחיקת סדרות קודמות
        movingAverageSeriesRef.current.forEach(series => chartRef.current.removeSeries(series));
        movingAverageSeriesRef.current = [];

         // הוספת ממוצעים נעים
        movingAverages.forEach((period) => {
          if (typeof period !== 'number' || isNaN(period) || period <= 0) {
            console.warn(`⛔ Invalid MA period: ${period}`);
            return;
          }

          const maData = addMovingAverage(chartData, period);
          if (maData.length === 0) {
            console.warn(`⚠️ Skipping MA${period} - not enough data`);
            return;
          }

          console.log(`✅ MA${period} calculated:`, maData.slice(-5)); // הדפס אחרונות לבדיקה

          const color = getRandomColor();
          const series = chartRef.current.addLineSeries({
            color,
            title: `MA ${period}`,
          });
          series.setData(maData);
          movingAverageSeriesRef.current.push(series);
        });

        
        if (selectedIndicator === 'macd') {
          const { macdLine, signalLine, histogram } = calculateMACD(chartData);
          
          // קו MACD
          const macdSeries = chartRef.current.addLineSeries({ color: 'blue', title: 'MACD Line' });
          macdSeries.setData(macdLine.map((value, index) => ({ time: chartData[index].time, value })));
        
          // קו האיתות
          const signalSeries = chartRef.current.addLineSeries({ color: 'red', title: 'Signal Line' });
          signalSeries.setData(signalLine.map((value, index) => ({ time: chartData[index].time, value })));
        
          // היסטוגרמה
          const histogramSeries = chartRef.current.addHistogramSeries({ color: 'green', title: 'MACD Histogram' });
          histogramSeries.setData(histogram.map((value, index) => ({ time: chartData[index].time, value })));
        } else if (selectedIndicator === 'rsi') {
          const rsiData = calculateRSI(chartData);
          const rsiSeries = chartRef.current.addLineSeries({ color: 'purple', title: 'RSI' });
          rsiSeries.setData(rsiData);
        }

        // בדיקה אם יש פוזיציה פתוחה של המנייה שנבחרה
        if (portfolio && portfolio.positions.length > 0) {
          const position = portfolio.positions.find(pos => pos.ticker === ticker);
          if (position) {
            setCurrentPosition(position); // עדכון מצב עם הפוזיציה הפתוחה
          } else {
            setCurrentPosition(null);
          }
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(`Failed to fetch stock data for ${ticker}`);
        setChartData([]);
      }
    };

    fetchData();
  }, [ticker, candleSize, movingAverages,selectedIndicator,portfolio]);

  const addMovingAverage = (data, period) => {
    if (!data || data.length === 0 || period > data.length) return [];

    const maData = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const avg = slice.reduce((acc, val) => acc + val.close, 0) / period;
      maData.push({ time: data[i].time, value: avg });
    }
    return maData;
  };


  const calculateEMA = (data, period) => {
    let multiplier = 2 / (period + 1);
    let ema = [data[0].close]; // ערך התחלתי
    for (let i = 1; i < data.length; i++) {
      ema.push(((data[i].close - ema[i - 1]) * multiplier) + ema[i - 1]);
    }
    return ema;
  };

  const calculateMACD = (data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
    const emaShort = calculateEMA(data, shortPeriod);
    const emaLong = calculateEMA(data, longPeriod);
    
    const macdLine = emaShort.map((value, index) => value - emaLong[index]);
    const signalLine = calculateEMA(macdLine, signalPeriod);
    const histogram = macdLine.map((value, index) => value - signalLine[index]);
  
    return { macdLine, signalLine, histogram };
  };
  

  const calculateRSI = (data, period = 14) => {
    let gains = 0, losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const diff = data[i].close - data[i - 1].close;
      if (diff >= 0) {
        gains += diff;
      } else {
        losses -= diff;
      }
    }
  
    let avgGain = gains / period;
    let avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    const rsiData = [100 - (100 / (1 + rs))];
  
    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i].close - data[i - 1].close;
      if (diff >= 0) {
        avgGain = ((avgGain * (period - 1)) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = ((avgLoss * (period - 1)) - diff) / period;
      }
  
      const rs = avgGain / avgLoss;
      rsiData.push({ time: data[i].time, value: 100 - (100 / (1 + rs)) });
    }
  
    return rsiData;
  };
  
  useEffect(() => {
    const onCrosshairMove = (param) => {
      if (!param || !param.seriesData) {
        tooltipRef.current.style.display = 'none';
        return;
      }
  
      const priceData = param.seriesData.get(candlestickSeriesRef.current);
      if (!priceData) {
        tooltipRef.current.style.display = 'none';
        return;
      }
  
      const { time, open, high, low, close } = priceData;
      const date = new Date(time * 1000).toLocaleString();
      tooltipRef.current.innerHTML = `
        <div>Date: ${date}</div>
        <div>Open: ${open.toFixed(2)}</div>
        <div>High: ${high.toFixed(2)}</div>
        <div>Low: ${low.toFixed(2)}</div>
        <div>Close: ${close.toFixed(2)}</div>
      `;
  
      const chartRect = chartContainerRef.current.getBoundingClientRect();
      const tooltipWidth = tooltipRef.current.clientWidth;
      const tooltipHeight = tooltipRef.current.clientHeight;
  
      let left = param.point.x + 20;
      let top = param.point.y - tooltipHeight - 20;
  
      if (left + tooltipWidth > chartRect.width) left = param.point.x - tooltipWidth - 20;
      if (top < 0) top = param.point.y + 20;
  
      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.display = 'block';
    };
  
    chartRef.current.subscribeCrosshairMove(onCrosshairMove);
  
    return () => chartRef.current.unsubscribeCrosshairMove(onCrosshairMove);
  }, []);

  // Handle trade (buy or sell)
  const handleTrade = async (event, action) => {
    event.preventDefault();
    const lastClosePrice = chartData[chartData.length - 1].close;
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid quantity greater than zero.');
      return;
    }

    const actionVerb = action === 'buy' ? 'buy' : 'sell';

    try {
          // Automatically buy into a long position
        const response = await axios.post(`/transactions/${actionVerb}`, {
          ticker,
          shares: quantity,
          price: lastClosePrice
        });
          // Add transaction to the state for tracking
        const transaction = {
          ticker,
          price: lastClosePrice,
          type: actionVerb,
          time: new Date(),
        };
        setTransactions([...transactions, transaction]);

        toast.success(`Successfully ${actionVerb === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${ticker}!`);
        setCurrentPosition(response.data.positions.find(pos => pos.ticker === ticker));
      } catch (error) {
          console.error('Error during trade:', error);
          toast.error('Trade failed. Please try again.');
      }

      setIsTradePopupOpen(false); // Close the trade popup
    };
    
      // Adding markers to the chart
    useEffect(() => {
      if (!chartRef.current || !candlestickSeriesRef.current) return;

      // Reset markers on every update
      candlestickSeriesRef.current.setMarkers([]);

      const markers = transactions.map((transaction) => ({
        time: Math.floor(new Date(transaction.time).getTime() / 1000), // converting to timestamp
        position: transaction.type === 'buy' ? 'belowBar' : 'aboveBar',
        color: transaction.type === 'buy' ? 'green' : 'red',
        shape: transaction.type === 'buy' ? 'arrowUp' : 'arrowDown',
        text: `${transaction.type.toUpperCase()} @ ${transaction.price.toFixed(2)}`,
      }));

      // Adding the markers to the candlestick series
      candlestickSeriesRef.current.setMarkers(markers);
    }, [transactions, chartData,ticker]);

    
  return (
    <>
    <div className="stock-data-container">
      {/* Main Form and Chart Section */}
      <form className="stock-form">
        <TextField
          label="Stock Ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          variant="outlined"
          required
        />
        <InputLabel id="candle-size-label">Candle Size</InputLabel>
        <Select
          labelId="candle-size-label"
          value={candleSize}
          onChange={(e) => setCandleSize(e.target.value)}
          variant="outlined"
        >
          <MenuItem value="1m">1 Minute</MenuItem>
          <MenuItem value="2m">2 Minutes</MenuItem>
          <MenuItem value="5m">5 Minutes</MenuItem>
          <MenuItem value="15m">15 Minutes</MenuItem>
          <MenuItem value="30m">30 Minutes</MenuItem>
          <MenuItem value="1h">1 Hour</MenuItem>
          <MenuItem value="1d">1 Day</MenuItem>
          <MenuItem value="5d">5 Day</MenuItem>
          <MenuItem value="1wk">1 Week</MenuItem>
          <MenuItem value="1mo">1 Mouth</MenuItem>
          <MenuItem value="3mo">3 Mouth</MenuItem>

        </Select>
        <InputLabel id="candle-size-label">Moving Averages</InputLabel>
        <TextField
          label="Moving Averages"
          placeholder="e.g., 10,20,50"
          onChange={(e) => setMovingAverages(e.target.value.split(',').map(Number))}
          variant="outlined"
        />
        <InputLabel id="indicator-label">Indicators</InputLabel>
        <Select
          labelId="indicator-label"
          value={selectedIndicator}
          onChange={(e) => setSelectedIndicator(e.target.value)}
          variant="outlined"
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="macd">MACD</MenuItem>
          <MenuItem value="rsi">RSI</MenuItem>
        </Select>
        <Button
          variant="contained"
          color="primary"
          startIcon={<TrendingUp />}
          onClick={() => setIsTradePopupOpen(true)}
        >
          Trade
        </Button>
      </form>

      <div ref={chartContainerRef} style={{ flex: 1, marginTop: 20, marginBottom: 20 }} />
      <div>
      <FavoriteButton ticker={ticker} />
      </div>
      

      {/* Price Alerts Section */}
      <div className="alert-container">
        <PriceAlert ticker={ticker} />
      </div>

      
     
      
    {/* Trade Popup */}
      {isTradePopupOpen && (
        <div className="trade-popup-overlay">
          <div className="trade-popup-content">
            <Button onClick={() => setIsTradePopupOpen(false)} startIcon={<Close />} className="close-button" />
            <form onSubmit={(e) => handleTrade(e, 'buy')}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
        
              <Button type="submit" variant="contained" color="success" startIcon={<ShoppingCart />}>
                Buy
              </Button>
              <Button onClick={(e) => handleTrade(e, 'sell')} variant="contained" color="secondary" startIcon={<TrendingDown />}>
                Sell
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
    <div>
    </div>

    <div className='position-container'>
      
       {/* Open positions */}
       {currentPosition ? (
        <div className="position-details">
          <h4>Open Position for {currentPosition.ticker}</h4>
          <p>Shares: {currentPosition.shares}</p>
          <p>Average Price: ${currentPosition.average_price.toFixed(2)}</p>
          <p>Position Type: {currentPosition.position_type}</p>
        </div>
      ) : (
        <p>No open positions for this stock</p>
      )}
        <StockNews ticker={ticker} />

    </div>
      </>
      

   
  );
};


export default StockData;
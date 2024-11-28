import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { createChart } from 'lightweight-charts';
import { TextField, Button, Typography, Box, MenuItem } from '@mui/material';

const StrategyTrade = () => {
  const [ticker, setTicker] = useState('');
  const [interval, setInterval] = useState('1d');
  const [period, setPeriod] = useState('1y');
  const [buyCondition, setBuyCondition] = useState("MA20 > MA50");
  const [sellCondition, setSellCondition] = useState("MA20 < MA50");
  const [maShort, setMaShort] = useState(20); // ממוצע קצר ברירת מחדל
  const [maLong, setMaLong] = useState(50); // ממוצע ארוך ברירת מחדל
  const [results, setResults] = useState(null);
  const chartContainerRef = useRef();
  const chartRef = useRef();

  const handleStrategyTest = async () => {
    try {
      // Remove existing chart if it exists
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      // Send strategy conditions to backend
      const response = await axios.post('http://localhost:5000/api/strategy', {
        ticker,
        interval,
        period,
        ma_short: maShort, // שולח את הערך של הממוצע הקצר
        ma_long: maLong, // שולח את הערך של הממוצע הארוך
        buy_condition: buyCondition,
        sell_condition: sellCondition,
      });

      setResults(response.data);
      toast.success("Strategy test completed successfully");

      // Fetch historical stock data for chart display
      const stockDataResponse = await axios.get(`http://localhost:5000/api/stock/${ticker}`, {
        params: { period, interval },
      });

      let prices = stockDataResponse.data.prices;
      let dates = stockDataResponse.data.dates.map(date => {
        const parsedDate = new Date(date);
        return `${parsedDate.getFullYear()}-${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}-${parsedDate.getDate().toString().padStart(2, '0')}`;
      });

      // Prepare and sort data for the chart
      const chartData = dates.map((date, index) => ({
        time: date,
        value: prices[index],
      })).sort((a, b) => new Date(a.time) - new Date(b.time));

      const uniqueChartData = chartData.filter((item, index, self) =>
        index === self.findIndex((t) => t.time === item.time)
      );

      chartRef.current = createChart(chartContainerRef.current, { width: 800, height: 400 });
      const lineSeries = chartRef.current.addLineSeries();
      lineSeries.setData(uniqueChartData);

      // Add buy/sell markers
      const buySellMarkers = [];
      response.data.buy_signals.forEach(signal => {
        const date = new Date(signal.date);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        buySellMarkers.push({
          time: formattedDate,
          position: 'belowBar',
          color: 'green',
          shape: 'arrowUp',
          text: `Buy @ ${signal.price.toFixed(2)}`,
        });
      });

      response.data.sell_signals.forEach(signal => {
        const date = new Date(signal.date);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        buySellMarkers.push({
          time: formattedDate,
          position: 'aboveBar',
          color: 'red',
          shape: 'arrowDown',
          text: `Sell @ ${signal.price.toFixed(2)} (${signal.profit_loss.toFixed(2)})`,
        });
      });

      buySellMarkers.sort((a, b) => new Date(a.time) - new Date(b.time));
      lineSeries.setMarkers(buySellMarkers);
    } catch (error) {
      console.error('Strategy Test Error:', error);
      toast.error(`Error: ${error.message || 'Strategy test failed'}`);
    }
  };

  return (
    <Box sx={{ maxWidth: '500px', margin: 'auto', padding: '20px', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>Strategy Trade</Typography>
      
      <TextField label="Ticker Symbol" value={ticker} onChange={(e) => setTicker(e.target.value)} fullWidth margin="normal" />
      <TextField
        label="Interval"
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
        select
        fullWidth
        margin="normal"
        SelectProps={{ native: true }}
      >
        <option value="1m">1 Minute</option>
        <option value="5m">5 Minutes</option>
        <option value="15m">15 Minutes</option>
        <option value="1d">1 Day</option>
      </TextField>
      <TextField
        label="Period"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        select
        fullWidth
        margin="normal"
        SelectProps={{ native: true }}
      >
        <option value="1mo">1 Month</option>
        <option value="1y">1 Year</option>
        <option value="2y">2 Years</option>
        <option value="5y">5 Years</option>
      </TextField>
      <TextField 
        label="Short MA Period" 
        value={maShort} 
        onChange={(e) => setMaShort(e.target.value)} 
        type="number" 
        fullWidth 
        margin="normal" 
      />

      <TextField 
        label="Long MA Period" 
        value={maLong} 
        onChange={(e) => setMaLong(e.target.value)} 
        type="number" 
        fullWidth 
        margin="normal" 
      />
      <TextField label="Buy Condition" value={buyCondition} onChange={(e) => setBuyCondition(e.target.value)} fullWidth margin="normal" />
      <TextField label="Sell Condition" value={sellCondition} onChange={(e) => setSellCondition(e.target.value)} fullWidth margin="normal" />
      
      <Button variant="contained" color="primary" onClick={handleStrategyTest} sx={{ marginTop: '20px' }}>Test Strategy</Button>
      
      {results && (
        <Box sx={{ marginTop: '20px', textAlign: 'left' }}>
          <Typography variant="h5">Strategy Results</Typography>
          <Typography>Total Profit/Loss: ${results.total_profit_loss.toFixed(2)}</Typography>
          <Typography variant="h6" sx={{ marginTop: '10px' }}>Transactions:</Typography>
          {results.sell_signals.map((trade, index) => (
            <Box key={index} sx={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <Typography>Sell Date: {trade.date}</Typography>
              <Typography>Sell Price: ${trade.price}</Typography>
              <Typography>Profit/Loss: ${trade.profit_loss.toFixed(2)}</Typography>
            </Box>
          ))}
        </Box>
      )}
      <div ref={chartContainerRef} style={{ position: 'relative', margin: '20px 0' }}></div>
    </Box>
  );
};

export default StrategyTrade;

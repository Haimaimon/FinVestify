import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { createChart } from "lightweight-charts";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Paper,
  Divider,
  Select,
  InputLabel,
} from "@mui/material";

const StrategyTrade = () => {
  const [ticker, setTicker] = useState("");
  const [interval, setInterval] = useState("1d");
  const [period, setPeriod] = useState("1y");
  const [maShort, setMaShort] = useState(20);
  const [maLong, setMaLong] = useState(50);
  const [indicator, setIndicator] = useState("none");
  const [results, setResults] = useState(null);
  const chartContainerRef = useRef();
  const chartRef = useRef();

  const handleStrategyTest = async () => {
    try {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
  
      // API Request for strategy
      const response = await axios.post("http://localhost:5000/api/strategy", {
        ticker,
        ma_short: indicator === "none" ? maShort : null, // שליחת ממוצעים נעים רק אם לא נבחר אינדיקטור
        ma_long: indicator === "none" ? maLong : null,
        period,
        interval,
        indicator, // Pass the selected indicator
      });
  
      setResults(response.data);
      toast.success("Strategy test completed successfully");
  
      // Fetch historical data for chart
      const stockDataResponse = await axios.get(
        `http://localhost:5000/api/stock/${ticker}`,
        {
          params: { period, interval },
        }
      );
  
      const { prices, dates } = stockDataResponse.data;
      const chartData = dates.map((date, index) => ({
        time: new Date(date).toISOString().split("T")[0],
        value: prices[index],
      }));
  
      // Initialize Chart
      chartRef.current = createChart(chartContainerRef.current, {
        width: 800,
        height: 400,
        layout: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
        },
        grid: {
          vertLines: { color: "#e0e0e0" },
          horzLines: { color: "#e0e0e0" },
        },
      });
  
      const lineSeries = chartRef.current.addLineSeries({ color: "#2196f3" });
      lineSeries.setData(chartData);
  
      // Add Buy/Sell markers
      const buySellMarkers = response.data.positions.map((signal) => ({
        time: signal.date,
        position: signal.type === "buy" ? "belowBar" : "aboveBar",
        color: signal.type === "buy" ? "green" : "red",
        shape: signal.type === "buy" ? "arrowUp" : "arrowDown",
        text: `${signal.type.toUpperCase()} @ ${signal.price.toFixed(2)}`,
      }));
  
      lineSeries.setMarkers(buySellMarkers);
  
      // Add indicator line if applicable
      if (response.data.indicator_data) {
        const indicatorSeries = chartRef.current.addLineSeries({
          color: indicator === "macd" ? "blue" : "purple",
        });
        const indicatorData = response.data.indicator_data.map((point) => ({
          time: point.date,
          value: point.value,
        }));
        indicatorSeries.setData(indicatorData);
      }
    } catch (error) {
      console.error("Strategy Test Error:", error);
      toast.error(`Error: ${error.message || "Strategy test failed"}`);
    }
  };
  
  
  return (
    <Paper
      elevation={4}
      sx={{
        maxWidth: "900px",
        margin: "auto",
        padding: "30px",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Strategy Trade
      </Typography>
      <Divider sx={{ marginBottom: "20px" }} />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        <TextField
          label="Ticker Symbol"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          fullWidth
        />
        <TextField
          label="Interval"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          select
          fullWidth
        >
          <MenuItem value="1m">1 Minute</MenuItem>
          <MenuItem value="2m">2 Minutes</MenuItem>
          <MenuItem value="5m">5 Minutes</MenuItem>
          <MenuItem value="15m">15 Minutes</MenuItem>
          <MenuItem value="30m">30 Minutes</MenuItem>
          <MenuItem value="60m">1 Hour</MenuItem>
          <MenuItem value="90m">90 Minutes</MenuItem>
          <MenuItem value="1d">1 Day</MenuItem>
          <MenuItem value="5d">5 Days</MenuItem>
          <MenuItem value="1wk">1 Week</MenuItem>
          <MenuItem value="1mo">1 Month</MenuItem>
          <MenuItem value="3mo">3 Months</MenuItem>
        </TextField>

        <TextField
          label="Period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          select
          fullWidth
        >
          <MenuItem value="1d">1 Day</MenuItem>
          <MenuItem value="5d">5 Days</MenuItem>
          <MenuItem value="1mo">1 Month</MenuItem>
          <MenuItem value="3mo">3 Months</MenuItem>
          <MenuItem value="6mo">6 Months</MenuItem>
          <MenuItem value="1y">1 Year</MenuItem>
          <MenuItem value="2y">2 Years</MenuItem>
          <MenuItem value="5y">5 Years</MenuItem>
          <MenuItem value="10y">10 Years</MenuItem>
          <MenuItem value="ytd">Year to Date</MenuItem>
          <MenuItem value="max">Max</MenuItem>
        </TextField>
        {indicator === "none" && (
          <>
            <TextField
              label="Short MA Period"
              value={maShort}
              onChange={(e) => setMaShort(e.target.value)}
              type="number"
              fullWidth
            />
            <TextField
              label="Long MA Period"
              value={maLong}
              onChange={(e) => setMaLong(e.target.value)}
              type="number"
              fullWidth
            />
          </>
        )}
        <Box sx={{ width: "100%" }}>
          <InputLabel id="indicator-label">Select Indicator</InputLabel>
          <Select
            labelId="indicator-label"
            value={indicator}
            onChange={(e) => setIndicator(e.target.value)}
            fullWidth
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="macd">MACD</MenuItem>
            <MenuItem value="rsi">RSI</MenuItem>
            <MenuItem value="ema">EMA</MenuItem>
          </Select>
        </Box>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleStrategyTest}
        sx={{ marginTop: "20px" }}
      >
        Test Strategy
      </Button>

      {results && (
  <Box sx={{ marginTop: "30px", textAlign: "left" }}>
    <Typography variant="h5">Strategy Results</Typography>
    <Typography>Total Profit/Loss: ${results.total_profit_loss.toFixed(2)}</Typography>
    {results.indicator_effect && (
      <Typography>Indicator Impact: {results.indicator_effect}</Typography>
    )}
    <Box>
      <Typography variant="h6" sx={{ marginTop: "20px" }}>
        Transactions
      </Typography>
      {results.positions.map((trade, index) => (
        <Box key={index} sx={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
          <Typography>
            {trade.type === "buy" ? "Buy" : "Sell"} on {trade.date} @ $
            {trade.price.toFixed(2)}
          </Typography>
          {trade.profit_loss && (
            <Typography>
              Profit/Loss: ${trade.profit_loss.toFixed(2)}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  </Box>
)}


      <div
        ref={chartContainerRef}
        style={{ width: "100%", height: "400px", marginTop: "30px" }}
      ></div>
    </Paper>
  );
};

export default StrategyTrade;

import React, { useState } from "react";
import axios from "axios";
import {
  createChart,
} from "lightweight-charts";
import { Box, TextField, Button, Typography, Card, CardContent, CircularProgress } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const StockPrediction = () => {
  const [stockName, setStockName] = useState("");
  const [sequenceLength, setSequenceLength] = useState(60);
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setError(null);
    setPredictedPrice(null);
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5658/api/predict", {
        stock_name: stockName,
        sequence_length: sequenceLength,
      });

      setPredictedPrice(response.data.predicted_price);
      console.log("data",predictedPrice)
      // Mock historical data for the chart
      const historical = Array.from({ length: sequenceLength }, (_, i) => ({
        time: i,
        value: Math.random() * 100, // Replace with real data if available
      }));
      setHistoricalData(historical);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    const chartContainer = document.getElementById("chart-container");
    chartContainer.innerHTML = ""; // Clear existing chart

    const chart = createChart(chartContainer, {
      width: 600,
      height: 400,
      layout: {
        backgroundColor: "#ffffff",
        textColor: "#000000",
      },
      grid: {
        vertLines: {
          color: "#e1e1e1",
        },
        horzLines: {
          color: "#e1e1e1",
        },
      },
    });

    const lineSeries = chart.addLineSeries();
    lineSeries.setData(historicalData);

    if (predictedPrice) {
      lineSeries.update({
        time: sequenceLength,
        value: predictedPrice,
      });
    }
  };

  React.useEffect(() => {
    if (historicalData.length > 0 || predictedPrice !== null) {
      renderChart();
    }
  }, [historicalData, predictedPrice]);

  return (
    <Box
      sx={{
        maxWidth: "800px",
        margin: "auto",
        padding: "20px",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Typography variant="h4" sx={{ color: "#0073e6", mb: 2, fontWeight: "bold" }}>
        Stock Price Prediction
      </Typography>

      <Card sx={{ mb: 3, p: 2, backgroundColor: "#e3f2fd" }}>
        <CardContent>
          <Typography variant="body1" sx={{ display: "flex", alignItems: "center" }}>
            <InfoOutlinedIcon sx={{ mr: 1 }} />
            Enter the stock name and sequence length to predict future prices. Use the sequence length to determine how much historical data the model should analyze.
          </Typography>
        </CardContent>
      </Card>

      <Box component="form" noValidate autoComplete="off" sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Stock Name"
          variant="outlined"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
          placeholder="Enter stock name (e.g., AAPL)"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Sequence Length"
          variant="outlined"
          value={sequenceLength}
          onChange={(e) => setSequenceLength(Number(e.target.value))}
          placeholder="Enter sequence length (e.g., 60)"
          sx={{ mb: 3 }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handlePredict}
          fullWidth
          startIcon={<TrendingUpIcon />}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Predict"}
        </Button>
      </Box>

      {predictedPrice && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="h5" sx={{ color: "#00796b" }}>
            Predicted Price: ${predictedPrice}
          </Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body1" sx={{ color: "red" }}>
            {error}
          </Typography>
        </Box>
      )}

      <Box
        id="chart-container"
        sx={{
          mt: 4,
          height: 400,
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      ></Box>
    </Box>
  );
};

export default StockPrediction;

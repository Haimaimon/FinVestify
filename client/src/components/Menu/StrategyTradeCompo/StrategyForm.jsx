import React, { useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  Button,
  Box,
} from "@mui/material";

const StrategyForm = ({ onRun, isLoading }) => {
  const [ticker, setTicker] = useState("");
  const [interval, setInterval] = useState("1d");
  const [period, setPeriod] = useState("1y");
  const [maShort, setMaShort] = useState(20);
  const [maLong, setMaLong] = useState(50);
  const [indicator, setIndicator] = useState("none");

  const handleSubmit = () => {
    onRun({ ticker, interval, period, ma_short: maShort, ma_long: maLong, indicator });
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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
        {["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"].map((val) => (
          <MenuItem key={val} value={val}>{val}</MenuItem>
        ))}
      </TextField>

      <TextField
        label="Period"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        select
        fullWidth
      >
        {["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"].map((val) => (
          <MenuItem key={val} value={val}>{val}</MenuItem>
        ))}
      </TextField>

      {indicator === "none" && (
        <>
          <TextField
            label="Short MA Period"
            value={maShort}
            onChange={(e) => setMaShort(Number(e.target.value))}
            type="number"
            fullWidth
          />
          <TextField
            label="Long MA Period"
            value={maLong}
            onChange={(e) => setMaLong(Number(e.target.value))}
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

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={isLoading || !ticker}
        sx={{ mt: 2 }}
      >
        {isLoading ? "Running..." : "Test Strategy"}
      </Button>
    </Box>
  );
};

export default StrategyForm;

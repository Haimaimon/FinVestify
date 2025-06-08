import React, { useState } from "react";
import { Box, Container, Typography, Paper, Divider } from "@mui/material";
import TradeForm from "../components/Menu/Crypto/TradeForm";
import SignalList from "../components/Menu/Crypto/SignalList";
import TradeTable from "../components/Menu/Crypto/TradeTable";
import BacktestForm from "../components/Menu/Crypto/BacktestForm";
import BacktestChart from "../components/Menu/Crypto/BacktestChart";
import TickerSidebar from "../components/Menu/Crypto/TickerSidebar";

const AlgoTradeForex = () => {
  const [backtestResult, setBacktestResult] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(""); // ✅ חדש - מה נבחר מה־TickerSidebar

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      {/* ℹ️ Short user explanation */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: "#f9f9f9" }}>
        <Typography variant="subtitle1" gutterBottom>
          🤖 Algo Trade – Send a Signal for Automatic Trading
        </Typography>
        <Typography variant="body2">
          Send a trading signal in the following format and the system will execute the trade for you in real time.
        </Typography>
        <Box
          sx={{
            mt: 1,
            backgroundColor: "#fff",
            p: 1.5,
            borderRadius: 1,
            fontFamily: "monospace",
            fontSize: "0.85rem",
            whiteSpace: "pre-line",
          }}
        >
          {`🔔BTC/USD🔔
Direction: BUY
Entry Price: 109750.00
TP1 109820.00
TP2 109830.00
TP3 109890.00
SL  109550.00`}
        </Box>
        <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
          🛈 Use the exact format in English – including labels like "Direction" and "Entry Price".
        </Typography>
      </Paper>

      {/* ✅ Sidebar תמיד מוצג */}
      <TickerSidebar onSelectAsset={(symbol) => setSelectedAsset(symbol)} />

      {/* 🔼 Trade signal submission form */}
      <TradeForm selectedAsset={selectedAsset} />

      {/* 📡 Open signals list */}
      <Box mt={6}>
        <SignalList />
      </Box>

      {/* 📈 Trade history table */}
      <Box mt={6}>
        <TradeTable />
      </Box>

      {/* 🧠 Divider */}
      <Divider sx={{ my: 5 }} />

      {/* 🧪 Backtest Strategy */}
      <Paper elevation={3} sx={{ p: 3, backgroundColor: "#f3f6fa" }}>
        <Typography variant="h6" gutterBottom>
          🧪 Backtest Strategy – Test Your Ideas
        </Typography>
        <Typography variant="body2" gutterBottom>
          Try your strategy on historical forex data and see if it would have succeeded. Enter a signal and choose a date range.
        </Typography>

        <BacktestForm onResult={setBacktestResult} />

        {backtestResult && (
          <Box mt={4}>
            <Typography variant="subtitle2" gutterBottom>
              📊 Backtest Results
            </Typography>
            <BacktestChart chartData={backtestResult.chartData} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              💰 PnL: {backtestResult.pnl?.toFixed(2)} | Asset: {backtestResult.asset}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AlgoTradeForex;

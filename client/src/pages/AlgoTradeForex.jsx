import React from "react";
import { Box, Container, Typography, Paper } from "@mui/material";
import TradeForm from "../components/Menu/Crypto/TradeForm";
import SignalList from "../components/Menu/Crypto/SignalList";
import TradeTable from "../components/Menu/Crypto/TradeTable";

const AlgoTradeForex = () => {
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

        <Box sx={{ mt: 1, backgroundColor: "#fff", p: 1.5, borderRadius: 1, fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre-line" }}>
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

      {/* 🔼 Trade signal submission form */}
      <TradeForm />

      {/* 📡 Open signals list */}
      <Box mt={6}>
        <SignalList />
      </Box>

      {/* 📈 Trade history table */}
      <Box mt={6}>
        <TradeTable />
      </Box>
    </Container>
  );
};

export default AlgoTradeForex;

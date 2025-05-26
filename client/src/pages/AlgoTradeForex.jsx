// pages/TestCrypto.jsx
import React from "react";
import { Box, Container } from "@mui/material";
import TradeForm from "../components/Menu/Crypto/TradeForm";
import SignalList from "../components/Menu/Crypto/SignalList";
import TradeTable from "../components/Menu/Crypto/TradeTable";

const AlgoTradeForex = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      {/* 🔼 טופס שליחת הודעת טרייד */}
      <TradeForm />

      {/* 📡 פקודות פתוחות */}
      <Box mt={6}>
        <SignalList />
      </Box>

      {/* 📈 היסטוריית עסקאות */}
      <Box mt={6}>
        <TradeTable />
      </Box>
    </Container>
  );
};

export default AlgoTradeForex;

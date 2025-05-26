// components/TradeTable.jsx
import React from "react";
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Typography, TableContainer, Chip, Snackbar, Alert
} from "@mui/material";
import { useTradeHistory } from "../../../hooks/useTradeHistory"

const TradeTable = () => {
  const {
    trades,
    lastTrade,
    snackbarOpen,
    handleCloseSnackbar
  } = useTradeHistory();

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date) ? "-" : date.toLocaleString("he-IL", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const calcPnL = (buy, sell) => {
    if (!buy || !sell) return "-";
    const diff = sell.price - buy.price;
    return diff.toFixed(2);
  };

  const groupedTrades = {};
  trades.forEach((trade) => {
    if (!groupedTrades[trade.groupId]) {
      groupedTrades[trade.groupId] = { buy: null, sell: null };
    }
    if (trade.direction === "BUY") groupedTrades[trade.groupId].buy = trade;
    if (trade.direction === "SELL") groupedTrades[trade.groupId].sell = trade;
  });

  const tradePairs = Object.values(groupedTrades);

  return (
    <>
      <TableContainer component={Paper} sx={{ maxWidth: 900, mx: "auto", mt: 6, boxShadow: 3 }}>
        <Typography variant="h5" align="center" sx={{ py: 2, fontWeight: "bold" }}>
          עסקאות שבוצעו (BUY + SELL)
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>נכס</TableCell>
              <TableCell>כיוון</TableCell>
              <TableCell>מחיר כניסה</TableCell>
              <TableCell>מחיר יציאה</TableCell>
              <TableCell>תאריך פתיחה</TableCell>
              <TableCell>רווח / הפסד</TableCell>
              <TableCell>סטטוס</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tradePairs.map((pair, idx) => (
              <TableRow key={idx}>
                <TableCell>{pair.buy?.asset || pair.sell?.asset}</TableCell>
                <TableCell>
                  <Chip label="BUY" color="success" variant="outlined" />
                </TableCell>
                <TableCell>{pair.buy?.price ?? "-"}</TableCell>
                <TableCell>{pair.sell?.price ?? "-"}</TableCell>
                <TableCell>{formatDate(pair.buy?.executedAt)}</TableCell>
                <TableCell sx={{ color: pair.sell ? (pair.sell.price - pair.buy.price >= 0 ? "green" : "red") : "gray" }}>
                  {calcPnL(pair.buy, pair.sell)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={pair.sell ? "סגורה" : "פתוחה"}
                    color={pair.sell ? "success" : "warning"}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          ✅ {lastTrade?.direction} בוצעה עבור {lastTrade?.asset} במחיר {lastTrade?.price}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TradeTable;

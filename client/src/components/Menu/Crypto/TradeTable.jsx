import React from "react";
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Typography, TableContainer, Chip, Snackbar, Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { useTradeHistory } from "../../../hooks/useTradeHistory";

const TradeTable = () => {
  const {
    trades,
    lastTrade,
    snackbarOpen,
    handleCloseSnackbar,
    handleDeleteTrade,
    deleteSuccess,
    handleCloseDeleteSnackbar
  } = useTradeHistory();

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date) ? "-" : date.toLocaleString("en-GB", {
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
          Executed Trades (BUY + SELL)
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell>Direction</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Exit Price</TableCell>
              <TableCell>Opened At</TableCell>
              <TableCell>Profit / Loss</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Delete</TableCell>
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
                    label={pair.sell ? "Closed" : "Open"}
                    color={pair.sell ? "success" : "warning"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDeleteTrade(pair.buy?.groupId || pair.sell?.groupId)}
                  >
                    <DeleteIcon />
                  </IconButton>
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
          ✅ {lastTrade?.direction} executed for {lastTrade?.asset} at price {lastTrade?.price}
        </Alert>
      </Snackbar>

      <Snackbar
        open={deleteSuccess}
        autoHideDuration={3000}
        onClose={handleCloseDeleteSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseDeleteSnackbar} severity="info" sx={{ width: "100%" }}>
          🗑️ Trade successfully deleted!
        </Alert>
      </Snackbar>
    </>
  );
};

export default TradeTable;

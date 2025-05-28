import React from "react";
import { Box, Typography, Divider } from "@mui/material";

const StrategyResults = ({ results }) => {
  if (!results) return null;

  return (
    <Box sx={{ mt: 4, textAlign: "left" }}>
      <Typography variant="h5" gutterBottom>
        Strategy Results
      </Typography>
      <Typography variant="subtitle1">
        Total Profit/Loss: ${results.total_profit_loss.toFixed(2)}
      </Typography>
      {results.indicator_effect && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {results.indicator_effect}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Transactions</Typography>

      {results.positions.map((trade, index) => (
        <Box key={index} sx={{ py: 1, borderBottom: "1px solid #ddd" }}>
          <Typography>
            {trade.type === "buy" ? "Buy" : "Sell"} on {trade.date} @ ${trade.price.toFixed(2)}
          </Typography>
          {trade.profit_loss != null && (
            <Typography>
              Profit/Loss: ${trade.profit_loss.toFixed(2)}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default StrategyResults;

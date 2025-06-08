import React, { useEffect, useRef } from "react";
import { useTickerPrices } from "../../../hooks/useTickerPrices";
import {
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const categories = {
  forex: [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "USD/CHF",
    "USD/CAD",
    "AUD/USD",
    "NZD/USD",
  ],
  crypto: [
    "BTC/USD",
    "ETH/USD",
    "BNB/USD",
    "ADA/USD",
    "DOGE/USD",
    "XRP/USD",
    "SOL/USD",
    "DOT/USD",
    "AVAX/USD",
    "LINK/USD",
    "MATIC/USD",
    "LTC/USD",
    "TRX/USD",
  ],
  commodities: ["XAU/USD", "XAG/USD", "XPT/USD", "XPD/USD"],
};

const TickerSidebar = ({ onSelectAsset }) => {
  const { data: tickers, isLoading, refetch } = useTickerPrices();

  // לשמור מחירים קודמים להשוואה (לצבע אדום/ירוק)
  const previousPrices = useRef({});

  useEffect(() => {
    if (tickers) {
      tickers.forEach((ticker) => {
        previousPrices.current[ticker.symbol] = ticker.price;
      });
    }
  }, [tickers]);

  const getColor = (symbol, currentPrice) => {
    const prevPrice = previousPrices.current[symbol];
    if (prevPrice === undefined) return "text.primary";
    if (currentPrice > prevPrice) return "green";
    if (currentPrice < prevPrice) return "red";
    return "text.primary";
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: 2,
        width: 260,
        position: "fixed",
        top: 150,
        right: 20,
        zIndex: 999,
        backgroundColor: "#f9f9f9",
        borderRadius: 2,
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        maxHeight: "80vh",
        overflowY: "auto", // גלילה במידה ויש הרבה
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">📈 Forex Prices</Typography>
        <Tooltip title="Refresh prices">
          <IconButton size="small" onClick={refetch}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {isLoading ? (
        <Box textAlign="center" mt={2}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        Object.entries(categories).map(([category, symbolsInCategory]) => (
          <Box key={category} mb={2}>
            <Typography variant="subtitle2" sx={{ color: "gray", mb: 1 }}>
              {category.toUpperCase()}
            </Typography>

            {symbolsInCategory.map((symbol) => {
              const ticker = tickers?.find((t) => t.symbol === symbol);

              return (
                <Box
                  key={symbol}
                  sx={{
                    mb: 1,
                    cursor: ticker?.price !== null ? "pointer" : "default",
                    "&:hover": {
                      backgroundColor:
                        ticker?.price !== null ? "#f0f0f0" : "transparent",
                      borderRadius: "5px",
                      px: 1,
                    },
                  }}
                  onClick={() =>
                    ticker?.price !== null &&
                    onSelectAsset &&
                    onSelectAsset(ticker.symbol)
                  }
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        ticker?.price === null
                          ? "gray"
                          : getColor(symbol, ticker?.price),
                      fontWeight: "bold",
                    }}
                  >
                    {symbol}:{" "}
                    {ticker?.price === null || ticker === undefined ? (
                      <span style={{ color: "gray" }}>No Data</span>
                    ) : (
                      ticker.price
                    )}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ))
      )}
    </Paper>
  );
};

export default TickerSidebar;

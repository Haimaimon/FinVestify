// hooks/useTradeHistory.js
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { fetchTradeHistory } from "../services/tradeService";

const socket = io("http://localhost:5000");

export const useTradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [lastTrade, setLastTrade] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const loadTrades = async () => {
      try {
        const data = await fetchTradeHistory();
        setTrades(data);
      } catch (err) {
        console.error("❌ שגיאה בטעינת היסטוריית טריידים:", err.message);
      }
    };

    loadTrades();

    socket.on("trade_executed", (newTrade) => {
      setTrades((prev) => [newTrade, ...prev]);
      setLastTrade(newTrade);
      setSnackbarOpen(true);
    });

    return () => {
      socket.off("trade_executed");
    };
  }, []);

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  return {
    trades,
    lastTrade,
    snackbarOpen,
    handleCloseSnackbar
  };
};

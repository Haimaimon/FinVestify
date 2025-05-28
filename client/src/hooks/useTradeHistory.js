// hooks/useTradeHistory.js
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { fetchTradeHistory ,deleteTrade} from "../services/tradeService";

const socket = io("http://localhost:5000");

export const useTradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [lastTrade, setLastTrade] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false); // ✅ חדש

  const refetchTrades = async () => {
    try {
      const data = await fetchTradeHistory();
      setTrades(data);
    } catch (err) {
      console.error("❌ שגיאה בטעינת היסטוריית טריידים:", err.message);
    }
  };

  const handleDeleteTrade = async (groupId) => {
    try {
      await deleteTrade(groupId);
      await refetchTrades();
      setDeleteSuccess(true); // ✅ הצגת הצלחה

    } catch (err) {
      console.error("❌ שגיאה במחיקת טרייד:", err);
    }
  };

  useEffect(() => {
    refetchTrades();

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
  const handleCloseDeleteSnackbar = () => setDeleteSuccess(false); // ✅ סוגר alert

  return {
    trades,
    lastTrade,
    snackbarOpen,
    handleCloseSnackbar,
    refetchTrades,
    handleDeleteTrade, // ✅ מחזיר את פונקציית המחיקה
    deleteSuccess,               // ✅ חדש
    handleCloseDeleteSnackbar    // ✅ חדש
  };
};

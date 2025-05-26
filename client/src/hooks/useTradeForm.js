// hooks/useTradeForm.js
import { useState } from "react";
import { sendSignal } from "../services/tradeService";
import { parseMessage } from "../utils/parseMessage";

export const useTradeForm = () => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [takeProfit, setTakeProfit] = useState(null);
  const [stopLoss, setStopLoss] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = async () => {
    const parsed = parseMessage(message);
    if (!parsed) {
      setStatus("❌ פורמט הודעה לא תקין");
      setSnackbarOpen(true);
      return;
    }

    setTakeProfit(parsed.takeProfit);
    setStopLoss(parsed.stopLoss);

    try {
      await sendSignal(message);
      setStatus("📡 הפקודה נשלחה, מעקב התחיל...");
      setMessage("");
    } catch (err) {
      setStatus("❌ שגיאה בשליחת הפקודה");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  return {
    message,
    setMessage,
    status,
    snackbarOpen,
    handleCloseSnackbar,
    handleSubmit,
    takeProfit,
    stopLoss,
  };
};

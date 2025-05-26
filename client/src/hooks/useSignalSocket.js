// hooks/useSignalSocket.js
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { fetchPendingSignals, deleteSignal } from "../services/tradeService";

const socket = io("http://localhost:5000"); // שנה בהתאם לסביבת העבודה שלך

export const useSignalSocket = () => {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    const loadSignals = async () => {
      try {
        const data = await fetchPendingSignals();
        setSignals(data);
      } catch (err) {
        console.error("❌ שגיאה בשליפת פקודות פתוחות:", err.message);
      }
    };

    loadSignals();

    socket.on("pending_created", (newSignal) => {
      setSignals((prev) => [newSignal, ...prev]);
    });

    socket.on("trade_executed", (trade) => {
      setSignals((prev) =>
        prev.filter(
          (s) => s.asset !== trade.asset || s.entry !== trade.entry
        )
      );
    });

    return () => {
      socket.off("pending_created");
      socket.off("trade_executed");
    };
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteSignal(id);
      setSignals((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("❌ שגיאה במחיקת פקודה:", err.message);
    }
  };

  return { signals, handleDelete };
};

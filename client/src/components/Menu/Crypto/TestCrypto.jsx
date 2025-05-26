import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from '../../../features/axiosConfig';
import TradeHistory from './TradeHistory'; // Assuming you have a TradeHistory component
const socket = io("http://localhost:5000");

const TestCrypto = () => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    socket.on("trade_executed", (data) => {
      setStatus(`✅ קנייה בוצעה עבור ${data.asset} ב-${data.price}`);
    });

    return () => socket.off("trade_executed");
  }, []);

  const handleSubmit = async () => {
    try {
      await axios.post('/signal', { message });
      setStatus("📡 ממתין למחיר...");
    } catch (err) {
      setStatus("❌ שגיאה בשליחה");
    }
  };

  return (
    <>
      <div className="p-4 max-w-xl mx-auto">
        <textarea
          rows={8}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="הכנס הודעה עם טרייד..."
          className="w-full border p-2 rounded mb-4"
        />
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
          שלח
        </button>
        <div className="mt-4 text-green-700 font-semibold">{status}</div>
      </div>
      <TradeHistory />
    </>
  );
};

export default TestCrypto;

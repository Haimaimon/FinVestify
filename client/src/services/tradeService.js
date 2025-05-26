// services/tradeService.js
import axios from "../features/axiosConfig"; // נתיב לדוגמה, עדכן לפי הצורך

// שליחת פקודת מסחר חדשה
export const sendSignal = async (message) => {
  return await axios.post("/signal", { message });
};

// שליפת פקודות פתוחות
export const fetchPendingSignals = async () => {
  const res = await axios.get("/pending-signals");
  return res.data;
};

// שליפת כל העסקאות שבוצעו
export const fetchTradeHistory = async () => {
  const res = await axios.get("/trades");
  return res.data;
};

// מחיקת פקודה פתוחה
export const deleteSignal = async (id) => {
  await axios.delete(`/pending-signals/${id}`);
};

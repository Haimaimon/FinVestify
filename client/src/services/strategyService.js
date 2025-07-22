import axios from "axios";

export const testStrategy = async (params) => {
  const res = await axios.post("http://127.0.0.1:5000/api/strategy", params);
  return res.data;
};

export const fetchStockData = async ({ ticker, period, interval }) => {
  const res = await axios.get(`http://127.0.0.1:5000/api/stock/${ticker}`, { params: { period, interval } });
  return res.data;
};

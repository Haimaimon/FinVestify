import axios from "../features/axiosConfig";

export const runBacktest = async (params) => {
  const { data } = await axios.post("/backtest", params);
  return data;
};

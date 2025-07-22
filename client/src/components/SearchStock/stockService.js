import axios from "axios";

// API base URL
const API_BASE_URL = "http://localhost:5658/api";

// Fetch stock details
export const fetchStockDetails = async (stcokName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stock-details/${stcokName}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching stock details:", err);
    throw new Error(err.response?.data?.error || "Failed to fetch stock details");
  }
};  

// Fetch stock extended data
export const fetchStockData = async (stockName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stock-extended/${stockName}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching extended stock details:", err);
    throw new Error(err.response?.data?.error || "Failed to fetch stock data");
  }
}
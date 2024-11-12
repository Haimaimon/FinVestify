// axiosConfig.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5555/api',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('tokenim'); // שינוי למפתח tokenim
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default instance;

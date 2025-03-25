const axios = require('axios');

const getStockData = async (ticker) => {
  const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=cnnc531r01qq36n63pt0cnnc531r01qq36n63ptg`);
  return response.data;
};


module.exports = getStockData;
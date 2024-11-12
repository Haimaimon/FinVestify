// controllers/newsController.js
const axios = require('axios');

const getNewsForStock = async (req, res) => {
  const { ticker, startDate, endDate } = req.query;

  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/everything?q=${ticker}&from=${startDate}&to=${endDate}&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    res.json(response.data.articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching news articles' });
  }
};

module.exports = { getNewsForStock };

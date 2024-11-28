const axios = require("axios");

const getStockNews = async() => {
    const apiKey = process.env.NEWS_API_KEY;
    const url = `https://newsapi.org/v2/everything?q=stocks&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        return response.data.articles;
    } catch (error) {
        console.error("Error fetching stock news : " , error);
        throw error;
    }
};

module.exports = {getStockNews};
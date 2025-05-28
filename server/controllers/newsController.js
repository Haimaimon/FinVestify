// controllers/newsController.js
const axios = require('axios');
const {getStockNews} = require("../utils/newsService");
const pusher = require("../config/pusher");

const keywords = [
  "IPO", "Initial Public Offering", "public offering", // הנפקה
  "merger", "merge", "amalgamation", "corporate merger", // מיזוג
  "acquisition", "acquire", "buyout", "takeover", // רכישה
  "clinical trial", "clinical phase", "medical trial", "drug trial", // ניסוי קליני
  "earnings", "revenue", "profit", "income", "financial results", "quarterly earnings", // דוחות פיננסיים
  "stock split", "share split", "reverse split", // פיצול מניות
  "dividend", "dividends", "distribution", "payout", // דיבידנדים
  "layoff", "job cut", "workforce reduction", // קיצוצים
  "expansion", "growth", "business growth", // התרחבות עסקית
  "partnership", "collaboration", "joint venture", // שיתוף פעולה
  "investment", "funding", "capital raise", "series funding", // השקעות וגיוס הון
  "bankruptcy", "insolvency", "restructuring", // פשיטת רגל או הסדר חוב
  "buyback", "share repurchase", // רכישה עצמית של מניות
  "upgrade", "downgrade", "rating change", // שינוי דירוג מניה
  "contract", "agreement", "deal", // חוזים והסכמים
  "regulation", "law", "legislation", "compliance", // רגולציה
  "data breach", "cybersecurity", "hack", "cyber attack", // אירועי סייבר
  "strike", "labor strike", "union action", "worker protest", // שביתות עובדים
  "product launch", "new product", "product release", // השקת מוצרים
  "guidance", "forecast", "projection", // תחזיות עתידיות
];

const filterRelevantNews = (articles) => {
  return articles.filter((article) => {
    return keywords.some((keyword) =>
      article.title.toLowerCase().includes(keyword.toLowerCase())
    );
  });
};

const sendNotification = (newsItem) => {
  pusher.trigger("stock-news", "new-alert", {
    title: newsItem.title,
    description: newsItem.description,
    url: newsItem.url,
    date: newsItem.publishedAt,
  });
};

const fetchNews = async (req, res) => {
  try {
    const articles = await getStockNews();
    const relevantNews = filterRelevantNews(articles);

    relevantNews.forEach((newsItem) => sendNotification(newsItem));

    res.status(200).json({ success: true, news: relevantNews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching news", error });
  }
};

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

module.exports = { getNewsForStock, fetchNews };

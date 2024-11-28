const express = require("express");
const { fetchNews } = require("../controllers/newsController");

const router = express.Router();

router.get("/fetch-news", fetchNews);

module.exports = router;

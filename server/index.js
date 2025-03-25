const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoute = require("./routes/userRoute");
const portfolioRoute = require('./routes/portfolioRoute');
const transactionRoute = require('./routes/transactionRoute');
const alertRoute = require('./routes/alertRoute');
const newsRoute = require('./routes/newsRoute');
const geminaiRoutes = require('./routes/geminaiRoutes');
const chatRoute = require('./routes/chatRoute');
const stockRoute = require('./routes/stockRoute');

const { getNewsForStock } = require('./controllers/newsController');
const app = express();


require("dotenv").config();

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoute);
app.use("/api", portfolioRoute);
app.use('/api/transactions', transactionRoute);
app.use('/api',alertRoute);
app.use("/api/news",newsRoute);

app.get('/api/news', getNewsForStock);

// שימוש בנתיבים (Routes) של Geminai
app.use('/api/geminai', geminaiRoutes);
app.use('/api/chat', chatRoute);
app.use('/api/stocks', stockRoute);
// Start alert service
const triggerAlerts = require('./utils/alertService');
triggerAlerts(); // Start the alert service

const port = 5555;
const uri = process.env.MONGO_URI;

app.listen(port , (req,res) => {
    console.log(`Server running on port : ${port}`);
});

mongoose.connect(uri)
.then(() => console.log("MongoDB connection established"))
.catch((error) => console.log("MongoDB connection failed: " ,error.message));
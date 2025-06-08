const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const mongoose = require("mongoose");
const userRoute = require("./routes/userRoute");
const portfolioRoute = require('./routes/portfolioRoute');
const transactionRoute = require('./routes/transactionRoute');
const alertRoute = require('./routes/alertRoute');
const newsRoute = require('./routes/newsRoute');
const geminaiRoutes = require('./routes/geminaiRoutes');
const chatRoute = require('./routes/chatRoute');
const stockRoute = require('./routes/stockRoute');

const signalRoute = require("./routes/signalRoute");
const tradeRoute = require("./routes/tradeRoute");
const pendingRoute = require("./routes/pendingRoute");
const backtestRoute = require("./routes/backtestRoute");
const priceTickerRoutes = require("./routes/priceTickerRoutes");

const { startAllWatchers } = require("./utils/priceWatcher");

const { getNewsForStock } = require('./controllers/newsController');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // או הדומיין שלך
    methods: ["GET", "POST"]
  }
});

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

app.use("/api/signal", signalRoute);
app.use("/api/trades", tradeRoute);
app.use("/api/pending-signals", pendingRoute);

app.use("/api/backtest", backtestRoute);

app.use("/api/prices", priceTickerRoutes);

// Start alert service
const triggerAlerts = require('./utils/alertService');
triggerAlerts(); // Start the alert service

app.set("socketio", io); // נשתמש בזה בתוך הקונטרולר

const port = 5555;
const uri = process.env.MONGO_URI;

app.listen(port , (req,res) => {
    console.log(`Server running on port : ${port}`);
});

server.listen(5000, async () => {
  console.log("🚀 Server + Socket.IO running on port 5000");
  await startAllWatchers(io); // הפעלת המעקב על עסקאות ממתינות
});

mongoose.connect(uri)
.then(() => console.log("MongoDB connection established"))
.catch((error) => console.log("MongoDB connection failed: " ,error.message));
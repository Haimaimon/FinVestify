const Pusher = require('pusher');
const Alert = require('../models/alert'); // Import the Alert model
const getStockData = require('./getStockData'); // Import the function to get stock data

const pusher = new Pusher({
  appId: '1816475',
  key: 'cb67c8ebd0ea59ee4a5e',
  secret: '1ea8e7cb8e3edb296b57',
  cluster: 'eu',
  useTLS: true
});

// Function to trigger alerts
const triggerAlerts = async () => {
  const alerts = await Alert.find({});
  
  alerts.forEach(async (alert) => {
    const stockData = await getStockData(alert.ticker); // Function to get the latest stock price
    console.log("pa",stockData.c);
    if (stockData.c >= alert.price) {
      pusher.trigger('price_alerts', 'price_alert', {
        ticker: alert.ticker,
        price: alert.price
      });

      // Optionally remove the alert after it triggers
      await alert.deleteOne();
    }
  });
};

// Schedule this function to run periodically
setInterval(triggerAlerts, 60000); // Every minute

module.exports = triggerAlerts;
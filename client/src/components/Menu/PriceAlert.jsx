import React, { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import axios from '../../features/axiosConfig';
import { TextField, Button ,IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import './StockDataStyles.css'
import { toast } from 'react-toastify';

const PriceAlert = ({ticker}) => {
  const [price, setPrice] = useState('');
  const [alerts, setAlerts] = useState([]);
  
  // Set up Pusher to listen for price alerts
  useEffect(() => {
    const pusher = new Pusher('cb67c8ebd0ea59ee4a5e', {
      cluster: 'eu',
    });

    const channel = pusher.subscribe('price_alerts');
    channel.bind('price_alert', (data) => {
      toast.success(`Alert! ${data.ticker} has reached $${data.price}`);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  // Fetch existing alerts on component mount
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('/alert');
        setAlerts(response.data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    fetchAlerts();
  }, []);

  // Handle Delete Alert Function
  const handleDeleteAlert = async (alertId) => {
    try {
      await axios.delete(`/alert/${alertId}`);
      toast.success("The Alert Deleted")
      // Remove the alert from local state
      setAlerts(alerts.filter(alert => alert._id !== alertId));
    } catch (error) {
      console.error("Failed to delete alert", error);
    }
  };

  // Function to add a new price alert
  const addPriceAlert = async () => {
    if (price <= 0) {
      toast.error("Please enter a price greater than zero.");
      return;
    }
    try {
      await axios.post('/alert/addalert', { ticker, price });
      toast.success("The Alert added");
      setAlerts([...alerts, { ticker, price }]);
      setPrice('');

      // Fetch updated alerts after adding a new one
    const response = await axios.get('/alert');
    setAlerts(response.data); // Update alerts in state with fresh data from server

    } catch (error) {
      console.error('Error adding alert:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
      <h3>Set Price Alert</h3>
      <TextField 
        label="Stock Ticker" 
        value={ticker} 
        variant="outlined" 
        style={{ marginBottom: 10 }} 
        InputProps={{
          readOnly: true,
        }} 
      />
      <TextField 
        label="Target Price" 
        type="number" 
        value={price} 
        onChange={(e) => setPrice(e.target.value)} 
        variant="outlined" 
        style={{ marginBottom: 10 }} 
        inputProps={{ min: 0.01, step: 0.01 }} // Minimum value 0.01 and step of 0.01 for decimals
      />

      <Button variant="contained" color="primary" onClick={addPriceAlert}>
        Set Alert
      </Button>

      <div className="alert-list">
      <h4>Your Alerts</h4>
      <ul>
        {alerts.map((alert,index) => (
          <li key={index}> {/* Use alert._id as the unique key */}
            {alert.ticker}: ${alert.price}
            <IconButton onClick={() => handleDeleteAlert(alert._id)} aria-label="delete" size="small">
              <DeleteIcon />
            </IconButton>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
};

export default PriceAlert;

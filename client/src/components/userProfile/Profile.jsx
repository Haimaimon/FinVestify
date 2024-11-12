// Profile.jsx
import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from '../../features/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import {
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Collapse,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function Profile() {
  const [amount, setAmount] = useState('');
  const [expandedTransactions, setExpandedTransactions] = useState(false);
  const [expandedPositions, setExpandedPositions] = useState(false);

  const { mutate, data: portfolio, isLoading, isError } = useMutation({
    mutationFn: () => axios.get('/portfolio'),
    onError: (error) => {
      console.error('Error fetching portfolio data:', error);
    },
  });

  useEffect(() => {
    mutate();
  }, [mutate]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading portfolio data</div>;

  const depositMutation = useMutation({
    mutationFn: (amount) => axios.post('/portfolio/deposit', { amount }),
    onSuccess: (response) => {
      toast.success(response.data.message);
      mutate(); // לרענן את הנתונים לאחר הפקדה
    },
    onError: () => {
      toast.error("Error depositing funds");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount) => axios.post('/portfolio/withdraw', { amount }),
    onSuccess: (response) => {
      toast.success(response.data.message);
      mutate(); // לרענן את הנתונים לאחר משיכה
    },
    onError: () => {
      toast.error("Error withdrawing funds");
    },
  });

  const handleDeposit = () => {
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    withdrawMutation.mutate(amount);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px' }}>
      {/* User Details */}
      <Card style={{ maxWidth: '600px', width: '100%', padding: '20px' }}>
        <Typography variant="h4" style={{ marginBottom: '20px' }}>User Profile</Typography>
        <Typography variant="h6">Name: {portfolio?.data.user.name}</Typography>
        <Typography variant="h6">Current Balance: ${portfolio?.data.cash_balance.toFixed(2)}</Typography>
      </Card>

      {/* Deposit and Withdraw Section */}
      <Card style={{ maxWidth: '600px', width: '100%', padding: '20px' }}>
        <Typography variant="h5" style={{ marginBottom: '10px' }}>Manage Funds</Typography>
        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          variant="outlined"
          fullWidth
          style={{ marginBottom: '10px' }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Button variant="contained" color="primary" onClick={handleDeposit}>Deposit</Button>
          <Button variant="contained" color="secondary" onClick={handleWithdraw}>Withdraw</Button>
        </div>
      </Card>

      {/* Current Positions */}
      <Card style={{ maxWidth: '600px', width: '100%', padding: '20px' }}>
        <Typography variant="h5">Current Positions</Typography>
        <IconButton onClick={() => setExpandedPositions(!expandedPositions)}>
          <ExpandMoreIcon />
        </IconButton>
        <Collapse in={expandedPositions}>
          {portfolio?.data.positions.map((position, index) => (
            <div key={index} className="position">
              <Typography><strong>Ticker:</strong> {position.ticker}</Typography>
              <Typography><strong>Shares:</strong> {position.shares}</Typography>
              <Typography><strong>Average Price:</strong> ${position.average_price.toFixed(2)}</Typography>
              <Typography><strong>Type:</strong> {position.position_type}</Typography>
            </div>
          ))}
        </Collapse>
      </Card>

      {/* Transaction History */}
      <Card style={{ maxWidth: '600px', width: '100%', padding: '20px' }}>
        <Typography variant="h5">Transaction History</Typography>
        <IconButton onClick={() => setExpandedTransactions(!expandedTransactions)}>
          <ExpandMoreIcon />
        </IconButton>
        <Collapse in={expandedTransactions}>
          {portfolio?.data.transactions.map((transaction, index) => (
            <div key={index} className="transaction">
              <Typography><strong>Ticker:</strong> {transaction.ticker}</Typography>
              <Typography><strong>Shares:</strong> {transaction.shares}</Typography>
              <Typography><strong>Type:</strong> {transaction.type}</Typography>
              <Typography><strong>Price:</strong> ${transaction.price.toFixed(2)}</Typography>
              <Typography><strong>Date:</strong> {new Date(transaction.date).toLocaleDateString()}</Typography>
              <Typography><strong>Profit/Loss:</strong> ${transaction.profitOrLoss.toFixed(2)}</Typography>
            </div>
          ))}
        </Collapse>
      </Card>
    </div>
  );
}

export default Profile;

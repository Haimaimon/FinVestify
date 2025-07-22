import React, { useEffect, useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from '../../features/axiosConfig';
import { toast } from 'react-toastify';
import {
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  Grid,
  Avatar,
  IconButton,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SavingsIcon from '@mui/icons-material/Savings';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

function Profile() {
  const [amount, setAmount] = useState('');
  const positionsContainerRef = useRef(null);
  const transactionsContainerRef = useRef(null);

  const { mutate, data: portfolio, isLoading, isError } = useMutation({
    mutationFn: () => axios.get('/portfolio'),
    onError: (error) => {
      console.error('Error fetching portfolio data:', error);
    },
  });

  useEffect(() => {
    mutate();
  }, [mutate]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">Loading portfolio data...</Typography>
      </Box>
    );
  }
  if (isError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
        <Typography variant="h6">Error loading portfolio data</Typography>
      </Box>
    );
  }

  const depositMutation = useMutation({
    mutationFn: (amount) => axios.post('/portfolio/deposit', { amount }),
    onSuccess: (response) => {
      toast.success(response.data.message);
      mutate();
    },
    onError: () => {
      toast.error('Error depositing funds');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount) => axios.post('/portfolio/withdraw', { amount }),
    onSuccess: (response) => {
      toast.success(response.data.message);
      mutate();
    },
    onError: () => {
      toast.error('Error withdrawing funds');
    },
  });

  const handleScroll = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  const handleDeposit = () => {
    if (amount <= 0) {
      toast.error('Please enter a positive amount');
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    if (amount <= 0) {
      toast.error('Please enter a positive amount');
      return;
    }
    withdrawMutation.mutate(amount);
  };

  return (
    <Box
      sx={{
        maxWidth: '1200px',
        margin: 'auto',
        padding: '20px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Grid container spacing={4}>
        {/* User Details */}
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffffff' }}>
            <Avatar sx={{ bgcolor: '#007bff', margin: '0 auto', width: 80, height: 80 }}>
              <AccountCircleIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
              {portfolio?.data.user.name}
            </Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>
              User Profile
            </Typography>
            <Typography
              variant="h6"
              sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MonetizationOnIcon sx={{ mr: 1, color: '#4caf50' }} />
              Current Balance: ${portfolio?.data.cash_balance.toFixed(2)}
            </Typography>
          </Card>
        </Grid>

        {/* Deposit and Withdraw Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Manage Funds
            </Typography>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ mb: 2 }}
              inputProps={{ min: 0 }}
            />
            <Box sx={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<SavingsIcon />}
                onClick={handleDeposit}
              >
                Deposit
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<AttachMoneyIcon />}
                onClick={handleWithdraw}
              >
                Withdraw
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Current Positions */}
        <Grid item xs={12}>
          <Card sx={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1, color: '#ff9800' }} /> Current Positions
            </Typography>
            <Box sx={{ position: 'relative' }}>
              <IconButton
                onClick={() => handleScroll(positionsContainerRef, 'left')}
                sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
              >
                <ArrowBackIosIcon />
              </IconButton>
              <Box
                ref={positionsContainerRef}
                sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  gap: '10px',
                  padding: '10px',
                }}
              >
                {portfolio?.data.positions.map((position, index) => (
                  <Card key={index} sx={{ minWidth: '200px', backgroundColor: '#f9f9f9' }}>
                    <CardContent>
                      <Typography><strong>Ticker:</strong> {position.ticker}</Typography>
                      <Typography><strong>Shares:</strong> {position.shares}</Typography>
                      <Typography><strong>Average Price:</strong> ${position.average_price.toFixed(2)}</Typography>
                      <Typography><strong>Type:</strong> {position.position_type}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <IconButton
                onClick={() => handleScroll(positionsContainerRef, 'right')}
                sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
          </Card>
        </Grid>

        {/* Transaction History */}
        <Grid item xs={12}>
          <Card sx={{ padding: '20px', backgroundColor: '#ffffff' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ mr: 1, color: '#673ab7' }} /> Transaction History
            </Typography>
            <Box sx={{ position: 'relative' }}>
              <IconButton
                onClick={() => handleScroll(transactionsContainerRef, 'left')}
                sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
              >
                <ArrowBackIosIcon />
              </IconButton>
              <Box
                ref={transactionsContainerRef}
                sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  gap: '10px',
                  padding: '10px',
                }}
              >
                {portfolio?.data.transactions.map((transaction, index) => (
                  <Card key={index} sx={{ minWidth: '200px', backgroundColor: '#f9f9f9' }}>
                    <CardContent>
                      <Typography><strong>Ticker:</strong> {transaction.ticker}</Typography>
                      <Typography><strong>Shares:</strong> {transaction.shares}</Typography>
                      <Typography><strong>Type:</strong> {transaction.type}</Typography>
                      <Typography><strong>Price:</strong> ${transaction.price.toFixed(2)}</Typography>
                      <Typography><strong>Date:</strong> {new Date(transaction.date).toLocaleDateString()}</Typography>
                      <Typography><strong>Profit/Loss:</strong> ${transaction.profitOrLoss.toFixed(2)}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <IconButton
                onClick={() => handleScroll(transactionsContainerRef, 'right')}
                sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;

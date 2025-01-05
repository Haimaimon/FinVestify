import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from '../features/axiosConfig';
import '../index.css';

export default function AuthForms({ formType, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: (userData) => axios.post('/users/login', userData),
    onSuccess: (data) => {
      //console.log("Response data:", data.data); // הצגת נתוני התגובה
      const token = data.data;
      localStorage.setItem('tokenim', token); // שמירת הטוקן
      onSuccess(token);
    },
    onError: (error) => {
      alert(error.response?.data || 'Login failed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData) => axios.post('/users/register', userData),
    onSuccess: () => {
      alert('Registration successful');
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data || 'Registration failed');
    },
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (initialBalance <= 0) {
      alert('Initial balance must be greater than zero');
      return;
    }
    registerMutation.mutate({ name, email, password, initial_balance: initialBalance });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <Button className="close-button" onClick={onClose}>
          <X />
        </Button>
        <h2>{formType === 'login' ? 'Login' : 'Register'}</h2>
        <form onSubmit={formType === 'login' ? handleLogin : handleRegister}>
          {formType === 'register' && (
            <TextField id="name" label="Name" type="text" fullWidth value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <TextField id="email" label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField id="password" label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} required />
          {formType === 'register' && (
            <>
              <TextField id="confirm-password" label="Confirm Password" type="password" fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <TextField id="initial-balance" label="Initial Balance" type="number" fullWidth value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} required inputProps={{ min: 1 }} />
            </>
          )}
          <Button type="submit" variant="contained" fullWidth>
            {formType === 'login' ? 'Sign in' : 'Sign up'}
          </Button>
        </form>
      </div>
    </div>
  );
}

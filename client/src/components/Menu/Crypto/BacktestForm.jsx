import React, { useState } from "react";
import { useBacktest } from "../../../hooks/useBacktest";
import { Button, TextField, Box } from "@mui/material";

const BacktestForm = ({ onResult }) => {
  const [form, setForm] = useState({ asset: "XAU/USD", direction: "BUY", entry: "", takeProfit: "", stopLoss: "", startDate: "", endDate: "" });
  const { mutate, isLoading } = useBacktest();

  const handleSubmit = () => {
    mutate(form, {
      onSuccess: (data) => onResult(data),
    });
  };

  return (
    <Box>
      <TextField label="Asset" value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} fullWidth />
      <TextField label="Entry" value={form.entry} onChange={(e) => setForm({ ...form, entry: e.target.value })} fullWidth />
      <TextField label="Take Profit" value={form.takeProfit} onChange={(e) => setForm({ ...form, takeProfit: e.target.value })} fullWidth />
      <TextField label="Stop Loss" value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} fullWidth />
      <TextField label="Start Date" type="date" onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth />
      <TextField label="End Date" type="date" onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth />
      <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>Run Backtest</Button>
    </Box>
  );
};

export default BacktestForm;

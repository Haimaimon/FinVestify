// components/TradeForm.jsx
import React from "react";
import {
  Box, Button, Container, Typography, TextField, Paper, Snackbar, Alert
} from "@mui/material";
import { useTradeForm } from "../../../hooks/useTradeForm";

const TradeForm = () => {
  const {
    message,
    setMessage,
    status,
    snackbarOpen,
    handleCloseSnackbar,
    handleSubmit,
    takeProfit,
    stopLoss,
  } = useTradeForm();

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, background: '#f9f9f9' }}>
        <Typography variant="h5" gutterBottom align="center" fontWeight="bold" color="primary">
          🔔 מערכת שליחת פקודת טרייד
        </Typography>

        <TextField
          label="הכנס הודעת טרייד"
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`🔔BTC/USD🔔\nDirection: BUY\nEntry Price: 109720.00\nTP1 109820.00\nTP2 109850.00\nTP3 109890.00\nSL 109600.00`}
          sx={{ mb: 3 }}
        />

        <Box textAlign="center">
          <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ px: 4, py: 1.5 }}>
            שלח פקודה
          </Button>
        </Box>

        {(takeProfit || stopLoss) && (
          <Box mt={3} textAlign="center">
            {takeProfit && (
              <Typography sx={{ color: "orange", fontWeight: 500 }}>
                🎯 ממתין ל־TP: {takeProfit}
              </Typography>
            )}
            {stopLoss && (
              <Typography sx={{ color: "red", fontWeight: 500 }}>
                ⛔ הגנה ב־SL: {stopLoss}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="subtitle1" align="center" sx={{ mt: 3, color: "green", fontWeight: 600 }}>
          {status}
        </Typography>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: "100%" }}>
          {status}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TradeForm;

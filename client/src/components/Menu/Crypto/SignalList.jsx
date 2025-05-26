// components/SignalList.jsx
import React from "react";
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Typography, TableContainer, Chip, Button
} from "@mui/material";
import { useSignalSocket } from "../../../hooks/useSignalSocket";

const SignalList = () => {
  const { signals, handleDelete } = useSignalSocket();

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString("he-IL", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <TableContainer component={Paper} sx={{ maxWidth: 800, mx: "auto", mt: 6, boxShadow: 3 }}>
      <Typography variant="h5" align="center" sx={{ py: 2, fontWeight: "bold" }}>
        פקודות פתוחות (Pending Signals)
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>נכס</TableCell>
            <TableCell>כיוון</TableCell>
            <TableCell>מחיר כניסה</TableCell>
            <TableCell>TP (יעד רווח)</TableCell>
            <TableCell>SL (הגנה)</TableCell>
            <TableCell>תאריך יצירה</TableCell>
            <TableCell>מחיקה</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {signals.map((signal, idx) => (
            <TableRow key={idx}>
              <TableCell>{signal.asset}</TableCell>
              <TableCell>
                <Chip
                  label={signal.direction}
                  color={signal.direction === "BUY" ? "success" : "error"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{signal.entry}</TableCell>
              <TableCell>{signal.takeProfit ?? "-"}</TableCell>
              <TableCell>{signal.stopLoss ?? "-"}</TableCell>
              <TableCell>{formatDate(signal.createdAt)}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleDelete(signal._id)}
                >
                  מחק
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SignalList;

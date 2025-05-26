import React, { useEffect, useState } from "react";
import axios from "../../../features/axiosConfig";
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Typography, TableContainer, Chip
} from "@mui/material";

const TradePairs = () => {
  const [pairedTrades, setPairedTrades] = useState([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await axios.get("/trades");

        // קבוצת טריידים לפי groupId
        const grouped = res.data.reduce((acc, trade) => {
          const group = acc[trade.groupId] || [];
          group.push(trade);
          acc[trade.groupId] = group;
          return acc;
        }, {});

        // הפיכת כל זוג BUY+SELL לאובייקט אחד
        const pairs = Object.values(grouped).map(group => {
          const buy = group.find(t => t.direction === "BUY");
          const sell = group.find(t => t.direction === "SELL");

          const profit = (buy && sell) ? (sell.price - buy.price).toFixed(2) : null;

          return {
            asset: buy?.asset || sell?.asset,
            entryPrice: buy?.price,
            exitPrice: sell?.price,
            executedAt: buy?.executedAt || sell?.executedAt,
            profit,
            hasSell: !!sell
          };
        });

        setPairedTrades(pairs);
      } catch (err) {
        console.error("❌ שגיאה בשליפת טריידים מזווגים:", err.message);
      }
    };

    fetchTrades();
  }, []);

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
    <TableContainer component={Paper} sx={{ maxWidth: 900, mx: "auto", mt: 6, boxShadow: 4 }}>
      <Typography variant="h5" align="center" sx={{ py: 2, fontWeight: "bold" }}>
        עסקאות שבוצעו (BUY + SELL)
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>נכס</TableCell>
            <TableCell>מחיר כניסה</TableCell>
            <TableCell>מחיר יציאה</TableCell>
            <TableCell>רווח / הפסד</TableCell>
            <TableCell>תאריך פתיחה</TableCell>
            <TableCell>סטטוס</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pairedTrades.map((trade, idx) => (
            <TableRow key={idx}>
              <TableCell>{trade.asset}</TableCell>
              <TableCell>{trade.entryPrice ?? "-"}</TableCell>
              <TableCell>{trade.exitPrice ?? "-"}</TableCell>
              <TableCell>
                {trade.profit !== null ? (
                  <span style={{ color: trade.profit >= 0 ? "green" : "red" }}>
                    {trade.profit}
                  </span>
                ) : "-"}
              </TableCell>
              <TableCell>{formatDate(trade.executedAt)}</TableCell>
              <TableCell>
                <Chip
                  label={trade.hasSell ? "סגורה" : "פתוחה"}
                  color={trade.hasSell ? "success" : "warning"}
                  variant="filled"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TradePairs;

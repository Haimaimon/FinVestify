import React, { useEffect, useState } from "react";
import axios from "../../features/axiosConfig";
import Pusher from "pusher-js";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Grid,
} from "@mui/material";
import { Notifications, OpenInNew } from "@mui/icons-material";

const StockNews = () => {
  const [newsAlerts, setNewsAlerts] = useState([]);

  // קריאה ראשונית לשרת לקבלת חדשות
  const fetchNewsFromServer = async () => {
    try {
      const response = await axios.get("/news/fetch-news");
      setNewsAlerts(response.data.news); // עדכון ההתראות שהתקבלו מהשרת
    } catch (error) {
      console.error("Error fetching news from server:", error);
    }
  };

  useEffect(() => {
    // קריאה לשרת בעת טעינת הרכיב
    fetchNewsFromServer();

    // חיבור ל-Pusher לקבלת עדכונים בזמן אמת
    const pusher = new Pusher("cb67c8ebd0ea59ee4a5e", {
      cluster: "eu",
    });

    const channel = pusher.subscribe("stock-news");
    channel.bind("new-alert", (data) => {
      setNewsAlerts((prev) => [data, ...prev]); // הוספת התראה חדשה לראש הרשימה
    });
    
    // קריאה מחזורית לשרת כל 5 דקות
    const interval = setInterval(() => {
        fetchNewsFromServer();
    } , 300000); 

    // ניתוק מ-Pusher בעת יציאה מהרכיב
    return () => {
      pusher.unsubscribe("stock-news");
      clearInterval(interval);
    };
  }, []);

  return (
    <Box
      sx={{
        padding: "20px",
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" sx={{ marginBottom: "20px" }}>
        <Notifications sx={{ fontSize: 40, color: "#1976d2" }} /> Stock News Alerts
      </Typography>
      <Grid container spacing={3}>
        {newsAlerts.length > 0 ? (
          newsAlerts.map((alert, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  boxShadow: 3,
                  "&:hover": { transform: "scale(1.02)", transition: "0.3s" },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                    <Avatar
                      sx={{ backgroundColor: "#1976d2", marginRight: 2 }}
                      alt="Stock News"
                    >
                      <Notifications />
                    </Avatar>
                    <Typography variant="h6">{alert.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {alert.description}
                  </Typography>
                </CardContent>
                <Box sx={{ padding: "10px" }}>
                  <IconButton
                    color="primary"
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNew />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="body1" sx={{ marginTop: "20px" }}>
            No new alerts at the moment. Stay tuned!
          </Typography>
        )}
      </Grid>
    </Box>
  );
};

export default StockNews;

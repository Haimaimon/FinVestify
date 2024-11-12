import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Avatar, Button } from '@mui/material';
import { ShowChart, TrendingUp, Security, AccountBalance } from '@mui/icons-material';
import './About.css';

function About() {
  return (
    <div className="about-container">
      <Container maxWidth="md">
        
        {/* Hero Section */}
        <div className="hero-section">
          <Typography variant="h2" className="hero-title">
            Welcome to FinVestify
          </Typography>
          <Typography variant="h5" className="hero-subtitle">
            Innovating the future of trading with intuitive insights and powerful tools.
          </Typography>
          <Button variant="contained" className="explore-button">
            Explore Now
          </Button>
        </div>
        
        {/* Content Section */}
        <Grid container spacing={4} className="content-section">
          <Grid item xs={12} sm={6} md={3}>
            <Card className="info-card">
              <Avatar className="info-icon">
                <ShowChart />
              </Avatar>
              <CardContent>
                <Typography variant="h6">Real-Time Insights</Typography>
                <Typography variant="body2">
                  Live stock data and visual market trends to help you stay ahead.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="info-card">
              <Avatar className="info-icon">
                <TrendingUp />
              </Avatar>
              <CardContent>
                <Typography variant="h6">Strategic Analysis</Typography>
                <Typography variant="body2">
                  Build and test strategies with our advanced analytics tools.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="info-card">
              <Avatar className="info-icon">
                <Security />
              </Avatar>
              <CardContent>
                <Typography variant="h6">Secure Transactions</Typography>
                <Typography variant="body2">
                  Your data and trades are fully secured with top-tier protection.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="info-card">
              <Avatar className="info-icon">
                <AccountBalance />
              </Avatar>
              <CardContent>
                <Typography variant="h6">Portfolio Growth</Typography>
                <Typography variant="body2">
                  Track your investments and see your portfolio grow with ease.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
      </Container>
    </div>
  );
}

export default About;

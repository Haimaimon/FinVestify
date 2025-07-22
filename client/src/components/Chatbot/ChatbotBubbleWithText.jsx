import React from 'react';
import { Box, Paper, Typography, Zoom } from '@mui/material';
import ChatbotBubble from './ChatbotBubble';

export default function ChatbotBubbleWithText({ onClick }) {
  return (
    <Zoom in={true} timeout={500}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 75,
          display: 'flex',
          alignItems: 'center',
          zIndex: 1300
        }}
      >
        {/* Text container */}
        <Paper
          elevation={3}
          sx={{
            p: 1,
            mr: 1,
            borderRadius: 1
          }}
        >
          <Typography variant="body2" fontWeight="500">
            Hi, I'm your smart trading assistant!
          </Typography>
        </Paper>
        
        {/* The original floating bubble button */}
        <ChatbotBubble onClick={onClick} />
      </Box>
    </Zoom>
  );
}

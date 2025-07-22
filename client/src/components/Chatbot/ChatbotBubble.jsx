// components/Chatbot/ChatbotBubble.jsx
import React from 'react';
import { Fab, Zoom } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

export default function ChatbotBubble({ onClick }) {
  // Zoom הוא אחד מסוגי ה-Transition ב-MUI (Grow, Zoom, Fade וכו').
  // הוא מספק אנימציית כניסה (appear) כשהרכיב מוצג על המסך.
  return (
    <Zoom in={true} timeout={500}>
      <Fab
        onClick={onClick}
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 30,
          // אפשר להגדיר עוד התאמות עיצוב:
          boxShadow: 3
        }}
        aria-label="open chat"
      >
        <ChatIcon />
      </Fab>
    </Zoom>
  );
}

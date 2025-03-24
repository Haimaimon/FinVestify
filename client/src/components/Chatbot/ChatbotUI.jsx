// components/Chatbot/ChatbotUI.jsx
import React, { useState } from 'react';
import { useChatbotLogic } from '../../hooks/useChatbotLogic';
import ChatMessage from './ChatMessage';

import {
  Box,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  Button
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ChatbotUI({ isOpen, onClose }) {
  const { messages, isLoading, sendMessage, clearChatHistory } = useChatbotLogic();
  const [userInput, setUserInput] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (userInput.trim()) {
      sendMessage(userInput.trim());
      setUserInput('');
    }
  };

  const handleClearHistory = () => {
    clearChatHistory();
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 70,
        right: 30,
        width: 320,
        height: 480,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <AppBar position="static" color="primary" sx={{ height: 56 }}>
        <Toolbar
          variant="dense"
          sx={{
            minHeight: '56px !important',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            צ'אט שוק ההון
          </Typography>
          <Box>
            <IconButton
              size="small"
              color="inherit"
              aria-label="clear chat"
              onClick={handleClearHistory}
              sx={{ mr: 1 }}
            >
              <DeleteIcon />
            </IconButton>
            <IconButton
              size="small"
              color="inherit"
              aria-label="close chatbot"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 1,
          overflowY: 'auto',
          backgroundColor: '#f9f9f9'
        }}
      >
        {messages.map((msg, index) => (
          <ChatMessage key={index} type={msg.type} content={msg.content} />
        ))}
        {isLoading && (
          <Typography
            variant="body2"
            sx={{ margin: '5px', fontStyle: 'italic' }}
          >
            טוען...
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid #ddd',
          p: 1
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="מה תרצה לשאול?"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          sx={{ flex: 1, mr: 1 }}
        />
        <Button variant="contained" endIcon={<SendIcon />} onClick={handleSend}>
          שליחה
        </Button>
      </Box>
    </Paper>
  );
}

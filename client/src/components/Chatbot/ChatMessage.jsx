// components/Chatbot/ChatMessage.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export default function ChatMessage({ type, content }) {
  const isUser = type === 'user';

  return (
    <Box
      sx={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        bgcolor: isUser ? 'primary.main' : 'grey.200',
        color: isUser ? 'primary.contrastText' : 'text.primary',
        m: 1,
        px: 2,
        py: 1,
        borderRadius: 2,
        maxWidth: '70%'
      }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </Typography>
    </Box>
  );
}

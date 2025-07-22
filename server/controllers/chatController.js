// src/controllers/chatController.js
const { getMessagesByUser, addMessage,deleteAllMessagesByUser } = require('../utils/chatService');

// GET /api/chat
exports.getUserMessages = async (req, res) => {
  try {
    // נניח שאתה משתמש באימות JWT או Session,
    // ויש לך req.user שמכיל את _id של המשתמש המחובר
    const userId = req.user._id;
    const messages = await getMessagesByUser(userId);
    return res.json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to get messages' });
  }
};

// POST /api/chat
exports.postUserMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'user', content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }
    const newMsg = await addMessage(userId, type, content);
    return res.json(newMsg);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to add message' });
  }
};

exports.deleteUserMessages = async (req, res) => {
    try {
      // מניחים ש-req.user._id קיים (Middleware אימות) 
      const userId = req.user._id;
      await deleteAllMessagesByUser(userId);
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete user messages' });
    }
  };
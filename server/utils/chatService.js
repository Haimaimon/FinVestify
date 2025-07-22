//utils/chatService.js
const Message = require('../models/Message');

/**
 * מחזיר את כל ההודעות של משתמש מסוים
 */
async function getMessagesByUser(userId) {
  // במקום { userId }, עכשיו { user: userId }
  return await Message.find({ user: userId }).sort({ createdAt: 1 });
}

/**
 * מוסיף הודעה חדשה
 */
async function addMessage(userId, type, content) {
  // user: userId, כי זהו _id של מסמך משתמש
  const newMsg = new Message({ user: userId, type, content });
  return await newMsg.save();
}

// פונקציה שמוחקת את כל ההודעות של משתמש מסוים
async function deleteAllMessagesByUser(userId) {
  return await Message.deleteMany({ user: userId });
}

module.exports = {
  getMessagesByUser,
  addMessage,
  deleteAllMessagesByUser
};
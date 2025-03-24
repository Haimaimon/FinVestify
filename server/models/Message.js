//models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  // במקום userId: String וכדומה, אנו משתמשים בהפניה ל-User
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',  // שם המודל של המשתמש 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['user', 'bot'], 
    default: 'user' 
  },
  content: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
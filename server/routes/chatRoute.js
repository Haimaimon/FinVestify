// src/routes/chatRoutes.js
const express = require('express');
const { getUserMessages, postUserMessage ,deleteUserMessages} = require('../controllers/chatController');
const router = express.Router();
const {auth} = require("../middleware/auth");
// נתיב GET לשאילת היסטוריית ההודעות
router.get('/',auth, getUserMessages);

// נתיב POST להוספת הודעה חדשה
router.post('/', auth ,postUserMessage);

router.delete('/', auth,deleteUserMessages); // מחיקת כל ההודעות


module.exports = router;

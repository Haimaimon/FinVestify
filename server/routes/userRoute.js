const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');

const router = express.Router();

// Route לרישום משתמש חדש
router.post('/register', registerUser);

// Route להתחברות
router.post('/login', loginUser);

module.exports = router;

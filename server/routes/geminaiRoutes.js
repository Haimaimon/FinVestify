/************************************************************
 * src/routes/geminaiRoutes.js
 * 
 * כאן נגדיר את ה-Router של Express, שבו ניתן לטפל במספר
 * מסלולים הקשורים ל-Geminai (לדוגמה, POST לשאלה).
 ************************************************************/
const express = require('express');
const { askGeminai } = require('../controllers/geminaiController');

const router = express.Router();

// POST /api/geminai
router.post('/', askGeminai);

module.exports = router;

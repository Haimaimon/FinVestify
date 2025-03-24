/*******************************************************************
 * src/controllers/geminaiController.js
 * מקבל מהלקוח את הטקסט (question) ושולח אותו לשירות.
 *******************************************************************/
const { getAnswerFromGeminai } = require('../utils/geminaiService');

/**
 * Controller: askGeminai
 * מטפל בבקשת POST מלקוח, שמכילה { question: "...שאלה בשוק ההון..." }.
 */
exports.askGeminai = async (req, res) => {
  try {
    const { question } = req.body;
    
    // דוגמה לבדיקה שהשאלה קשורה לשוק ההון:
    // אם נרצה לוודא שהשאלה מכילה "מנייה" / "מניות" / "בורסה" / "stock" / וכו':
    // if (!question.toLowerCase().includes('stock') && !question.includes('מנייה')) {
    //   return res.status(400).json({ error: 'השאלה אינה קשורה לשוק ההון.' });
    // }

    if (!question) {
      return res.status(400).json({ error: 'Missing "question" in request body.' });
    }

    // פנייה ל-Service המבצע את הקריאה בפועל ל-Google Generative AI
    const answer = await getAnswerFromGeminai(question);

    // מחזירים ללקוח תשובה
    res.json({ answer });
  } catch (error) {
    console.error('Error in askGeminai controller:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

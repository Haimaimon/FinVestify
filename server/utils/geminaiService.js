/*******************************************************************
 * src/services/geminaiService.js
 * פה נעשה שימוש בספריית "@google/generative-ai" כדי לפנות למודל Gemini.
 *******************************************************************/
const { GoogleGenerativeAI } = require('@google/generative-ai');

// נטען את המפתח שלנו מה-ENV
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCQ7e6hGOWSKHuJKecatjgRH1gfrggATeY';

// אתחול קליינט ה-Google Generative AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * יוצרים instance של מודל "gemini-2.0-flash" (או מודל אחר, לפי הצורך).
 */
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * מבצע קריאה ל-Google Generative AI, שולח prompt (שאלת המשתמש) ומחזיר את הטקסט.
 * @param {string} question טקסט שהמשתמש שאל (למשל "מה מצב מניית אפל?")
 * @returns {Promise<string>} תשובה מהמודל
 */
async function getAnswerFromGeminai(question) {
  try {
    // generateContent מקבל כפרמטר את ה-Prompt (השאלה)
    // ופועל מול המודל שהגדרנו.
    const result = await model.generateContent(question);

    // לפי תיעוד הספרייה, נוכל לשלוף את הטקסט מתוך result.response
    // ייתכן שזה משתנה בין גרסאות, בדוק שהפונקציה text() מחזירה בדיוק את התוכן.
    const answerText = result?.response?.text?.() 
                       || 'לא התקבלה תשובה מגוגל.';
    return answerText;
  } catch (error) {
    console.error('Error calling GoogleGenerativeAI:', error);
    throw new Error('Failed to get answer from Gemini');
  }
}

module.exports = {
  getAnswerFromGeminai,
};

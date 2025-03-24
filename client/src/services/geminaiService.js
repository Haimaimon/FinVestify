// services/geminaiService.js
import axios from '../features/axiosConfig';

/**
 * שולח שאלה לסוכן החכם (geminai API או כל מנוע אחר) ומחזיר תשובה.
 * @param {string} question - השאלה שהמשתמש הקליד
 * @returns {Promise<string>} - תשובה מהסוכן החכם
 */
export async function sendQuestionToGeminiAI(question) {
  try {
    // כאן אפשר לשנות לכתובת האמיתית של ה-API שלכם
    const response = await axios.post('/geminai', { question });
    // נניח שה-API מחזיר שדה בשם "answer"
    console.log('DATA:', response.data);

    console.log('Answer:', response.data.answer);
    console.log('Response data from Google:', JSON.stringify(response.data, null, 2));



    return response.data.answer; 
  } catch (error) {
    console.error('Error sending question to GeminiAI:', error);
    throw new Error('Failed to get answer from GeminiAI');
  }
}

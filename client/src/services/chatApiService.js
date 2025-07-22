// services/chatApiService.js
import axios from '../features/axiosConfig';    

/**
 * טוען את היסטוריית ההודעות של המשתמש (GET /api/chat).
 */
export async function fetchUserMessages() {
  const { data } = await axios.get('/chat');
  // data הוא מערך הודעות: [{ _id, user, type, content, createdAt }, ...]
  return data;
}

/**
 * שומר הודעה חדשה בשרת (POST /api/chat).
 * @param {{ type: 'user'|'bot', content: string }} message
 */
export async function saveMessageToServer(message) {
  const { data } = await axios.post('/chat', message);
  return data; // ההודעה שנשמרה בשרת, עם _id
}

/**
 * מוחק את כל ההודעות בשרת
 */
export async function deleteUserMessages() {
    const response = await axios.delete('/chat');
    return response.data;
  }
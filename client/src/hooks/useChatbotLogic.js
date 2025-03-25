// hooks/useChatbotLogic.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../features/axiosConfig'; 
import { fetchUserMessages, saveMessageToServer, deleteUserMessages } from '../services/chatApiService';
import { sendQuestionToGeminiAI } from '../services/geminaiService';

function parseAdvancedStockQuery(userInput) {
  // מסירים סימני פיסוק ומקטינים רישיות
  const sanitized = userInput.replace(/[?!.,]/g, '').toLowerCase();

  // 1) האם יש mention של “שנת 2025” או “2025” ?
  const yearMatch = sanitized.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : null;

  // 2) חיפוש ticker (נניח עד 5 אותיות)
  const tickerMatch = sanitized.match(/([a-z]{1,5})/); 
  // כמובן אפשר לשלב עם regex מורכב יותר.
  const ticker = tickerMatch ? tickerMatch[1].toUpperCase() : null;

  // 3) האם מדובר בשאלה אחוזים (“כמה אחוזים”) או בשאלה מחיר (“מה היה מחיר”)?
  let mode = null;
  if (/(\bעלתה\b|\bעלו\b|\bאחוזים\b|percent|%)/.test(sanitized)) {
    mode = 'percentChange';
  } else if (/(\bמה\b.*\bמחיר\b)|(\bprice\b.*\bwas\b)/.test(sanitized)) {
    mode = 'priceOnly';
  }

  if (ticker && year && mode) {
    return { ticker, year, mode };
  }
  return null;
}

/**
 * בודק אם הטקסט שהמשתמש הקליד מכיל בקשה למחיר מניה (ticker).
 * לדוגמה "מה המחיר של AAPL", "price of TSLA", "מה מחיר מניית msft" וכו'.
 * אפשר להרחיב את ה-Regex לפי הצורך.
 */
/*function parseStockTicker(userInput) {
    // 1) הסרת סימני שאלה/נקודה/פסיק/קריאה וכו'
  const sanitized = userInput.replace(/[?!.,]/g, '').toLowerCase();

   // 2) הרג'קס:
  //    - באנגלית: "price of AAPL"
  //    - בעברית: "מה מחיר מניית aapl", "מחיר מניית aapl", "מה המחיר של מניית aapl"
  //    - ננסה לתפוס אותיות לועזיות באורך 1 עד 5 (טיקרים נפוצים)
  //
  // הסבר:
  //  - price of\s+([a-z]{1,5})   => תופס price of + רווחים + עד 5 אותיות
  //  - מחיר(?:\s+(?:של))?\s+מניית\s+([a-z]{1,5})  => "מחיר" או "מחיר של" ואז "מניית X"
  //
  // שים לב: ייתכן משתמשים יקלידו בעברית "מה מחיר מניית X" או "מה המחיר של מניית X" 
  //         (יש עוד וריאציות), אפשר להרחיב עוד.
  const pattern = new RegExp(
    '(?:price of\\s+([a-z]{1,5}))' + 
    '|(?:מחיר(?:\\s+(?:של))?\\s+מניית\\s+([a-z]{1,5}))', 
    'i'
  );

  const match = sanitized.match(pattern);
  if (!match) {
    // לא זוהה טיקר
    return null;
  }
  // אם נתפס באנגלית => match[1], אם בעברית => match[2]
  return (match[1] || match[2])?.toUpperCase();
}*/

/**
 * Hook לניהול הצ'אט עם React Query:
 *   - שליפת היסטוריית הודעות (messages) ממטמון ו/או מהשרת
 *   - שליחת הודעה (user), אם מדובר בשאלה על מניה => פונים ל-API מניות
 *     אחרת => פונים לג'מינאי
 *   - החזרת ערכים (messages, isLoading, sendMessage) באותה צורה כמו קודם
 */
export function useChatbotLogic() {
  const queryClient = useQueryClient();

  // 1) Query: שליפה של היסטוריית ההודעות
  const {
    data: messages,
    isLoading: isMessagesLoading
  } = useQuery({
    queryKey: ['chatMessages'],
    queryFn: fetchUserMessages
    // אפשר להגדיר staleTime / cacheTime
  });

  // 2) Mutation: טיפול ב"שליחת הודעה" (user => bot).
  const { mutateAsync: sendChatFlow, isLoading: isMutationLoading } = useMutation({
    mutationFn: async (text) => {
      // שלב א) מוסיפים בשרת הודעת משתמש
      const userMsg = { type: 'user', content: text };
      await saveMessageToServer(userMsg);

      // שלב ב) מזהים אם השאלה על מניה
      let botResponse;
      // 1) נבדוק אם זו שאלה מתקדמת (טיקר + שנה + סוג)
      const advQuery = parseAdvancedStockQuery(text); 
      if (advQuery) {
        // { ticker, year, mode }
        const { ticker, year, mode } = advQuery;
        // נקרא לשרת: /api/stocks/year?ticker=...&year=...&mode=...
        const url = `/stocks/year?ticker=${ticker}&year=${year}&mode=${mode}`;
        const { data } = await axios.get(url);

        if (data.message === 'No data found') {
          botResponse = `לא נמצא מידע עבור ${ticker} בשנה ${year}`;
        } else if (mode === 'percentChange' && data.percentChange != null) {
          botResponse = `בשנת ${year} מניית ${ticker} השתנתה ב-${data.percentChange.toFixed(2)}% בין תחילת השנה לסופה.`;
        } else if (mode === 'priceOnly') {
          // priceOnly => יש data.firstClose, data.lastClose
          botResponse = `בשנת ${year} מניית ${ticker} החלה סביב ${data.firstClose} וסיימה סביב ${data.lastClose}.`;
        } else {
          botResponse = `קיבלתי נתונים: ${JSON.stringify(data)}`;
        }
      } else {
        // שאלה רגילה => ג'מינאי
        botResponse = await sendQuestionToGeminiAI(text);
      }

      // שלב ג) שומרים בשרת הודעת בוט עם הטקסט המתאים
      const botMsg = { type: 'bot', content: botResponse };
      await saveMessageToServer(botMsg);

      // נחזיר מערך עם 2 ההודעות החדשות
      return [userMsg, botMsg];
    },
    onSuccess: (newMessages) => {
      // שלב ד) עדכון המטמון
      queryClient.setQueryData(['chatMessages'], (old = []) => [...old, ...newMessages]);
    }
  });

  // 3) מחיקת היסטוריה
  const { mutateAsync: clearChatMutation, isLoading: isDeleting } = useMutation({
    mutationFn: async () => {
      return await deleteUserMessages();
    },
    onSuccess: () => {
      // מנקים את המטמון
      queryClient.setQueryData(['chatMessages'], []);
    }
  });

  // פונקציה שעוטפת את המוטציה
  async function sendMessage(text) {
    if (!text) return;
    await sendChatFlow(text);
  }

  async function clearChatHistory() {
    await clearChatMutation();
  }

  return {
    messages: messages || [],
    isLoading: isMessagesLoading || isMutationLoading || isDeleting,
    sendMessage,
    clearChatHistory
  };
}

// hooks/useChatbotLogic.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserMessages, saveMessageToServer, deleteUserMessages } from '../services/chatApiService';
import { sendQuestionToGeminiAI } from '../services/geminaiService';

/**
 * Hook לניהול הצ'אט עם React Query:
 *   - שליפת היסטוריית הודעות (messages) ממטמון ו/או מהשרת
 *   - שליחת הודעה (user), קבלת תשובה (bot), שמירה בשניהם בשרת
 *   - החזרת ערכים (messages, isLoading, sendMessage) באותה צורה כמו קודם
 */
export function useChatbotLogic() {
  const queryClient = useQueryClient();

  // 1) Query: שליפה של היסטוריית ההודעות
  const {
    data: messages,
    isLoading: isMessagesLoading
  } = useQuery({
    queryKey: ['chatMessages'], // מזהה במטמון
    queryFn: fetchUserMessages,
    // אפשר להגדיר staleTime או cacheTime לפי הצורך
  });

  // 2) Mutation: טיפול ב"שליחת הודעה" הכוללת:
  //    א) יצירת הודעת user בשרת
  //    ב) בקשת תשובה מ-Gemini
  //    ג) יצירת הודעת bot בשרת
  //    ד) עדכון המטמון (messages) אוטומטית
  const { mutateAsync: sendChatFlow, isLoading: isMutationLoading } = useMutation({
    mutationFn: async (text) => {
      // שלב א) הודעת User
      const userMsg = { type: 'user', content: text };
      await saveMessageToServer(userMsg);

      // שלב ב) בקשת תשובה מ-Gemini
      const botResponse = await sendQuestionToGeminiAI(text);

      // שלב ג) הודעת Bot
      const botMsg = { type: 'bot', content: botResponse };
      await saveMessageToServer(botMsg);

      // נחזיר מערך עם 2 ההודעות החדשות
      return [userMsg, botMsg];
    },
    onSuccess: (newMessages) => {
      // שלב ד) עדכון המטמון
      // נניח ש-old הוא מערך הודעות קיים או undefined אם אין
      queryClient.setQueryData(['chatMessages'], (old = []) => {
        return [...old, ...newMessages];
      });
    }
  });

   // 3) מחיקת היסטוריה (clearChat)
   const { mutateAsync: clearChatMutation, isLoading: isDeleting } = useMutation({
    mutationFn: async () => {
      return await deleteUserMessages();
    },
    onSuccess: () => {
      // כשנמחק בשרת בהצלחה, נמחק מהמטמון
      queryClient.setQueryData(['chatMessages'], []);
    }
  });

  // פונקציית עזר שהקומפוננטה שלך קוראת, למשל sendMessage(text)
  async function sendMessage(text) {
    if (!text) return;
    await sendChatFlow(text);
  }

  // פונקציית עזר לניקוי היסטוריה
  async function clearChatHistory() {
    await clearChatMutation(); 
  }

  return {
    // אם עדיין לא נטענו הודעות, ניתן messages = []
    // מה שנחזיר לקומפוננטה
    messages: messages || [],
    isLoading: isMessagesLoading || isMutationLoading || isDeleting,
    sendMessage,
    clearChatHistory // נוסיף
  };
}

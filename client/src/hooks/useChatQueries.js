// hooks/useChatQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../features/axiosConfig';

/**
 * מחזיר hook לשליפת היסטוריית ההודעות של המשתמש.
 * כולל mutation לשליחת הודעה חדשה.
 */
export function useChatQueries() {
  const queryClient = useQueryClient();

  // 1) Query: שליפת כל ההודעות
  const {
    data: messages,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['chatMessages'], // מזהה במטמון
    queryFn: async () => {
      const { data } = await axios.get('/chat'); // מניחים שהמשתמש מזוהה ע"י cookie/token
      return data; // מערך ההודעות
    }
  });

  // 2) Mutation: שליחת הודעה חדשה
  const { mutateAsync: sendMessageMutation } = useMutation({
    mutationFn: async (newMessageContent) => {
      const { data } = await axios.post('/chat', {
        type: 'user',
        content: newMessageContent
      });
      return data; // ההודעה שנוצרה
    },
    onSuccess: (newMsg) => {
      // מעדכן את המטמון באופן ידני, כדי להכניס את ההודעה החדשה
      queryClient.setQueryData(['chatMessages'], (old) => {
        if (!old) return [newMsg];
        return [...old, newMsg];
      });
    }
  });

  // 3) פונקציה לשליחת הודעת משתמש
  async function sendMessage(content) {
    await sendMessageMutation(content);
  }

  return {
    messages,
    isLoading,
    isError,
    sendMessage
  };
}

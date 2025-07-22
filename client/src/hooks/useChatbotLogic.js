// hooks/useChatbotLogic.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../features/axiosConfig'; 
import { fetchUserMessages, saveMessageToServer, deleteUserMessages } from '../services/chatApiService';
import { sendQuestionToGeminiAI } from '../services/geminaiService';

function parseAdvancedStockQuery(userInput) {
  const sanitized = userInput.replace(/[?!.,]/g, '').toLowerCase();
  const yearMatch = sanitized.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : null;
  const tickerMatch = sanitized.match(/([a-z]{1,5})/); 
  const ticker = tickerMatch ? tickerMatch[1].toUpperCase() : null;

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

function inferContextFromMessages(messages) {
  if (!messages || messages.length === 0) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === 'user') {
      const content = msg.content.toLowerCase();

      const tickerMatch = msg.content.match(/\b[A-Z]{2,5}\b/);
      if (tickerMatch) {
        return { type: 'stock', value: tickerMatch[0], raw: msg.content };
      }

      const stockKeywords = ['מניית', 'מניה', 'stock', 'ticker'];
      const hasStockWord = stockKeywords.some(word => content.includes(word));
      if (hasStockWord) {
        const symbolMatch = msg.content.match(/\b[A-Z]{2,5}\b/);
        if (symbolMatch) {
          return { type: 'stock', value: symbolMatch[0], raw: msg.content };
        }
      }

      if (/קריפטו|בינה מלאכותית|ai|נדלן|real estate|טכנולוגיה|finance|כלכלה|מדדים|s&p|nasdaq/.test(content)) {
        return { type: 'topic', value: content, raw: msg.content };
      }

      if (content.length > 15) {
        return { type: 'general', value: content, raw: msg.content };
      }
    }
  }

  return null;
}

export function useChatbotLogic() {
  const queryClient = useQueryClient();

  const {
    data: messages,
    isLoading: isMessagesLoading
  } = useQuery({
    queryKey: ['chatMessages'],
    queryFn: fetchUserMessages
  });

  const { mutateAsync: sendChatFlow, isLoading: isMutationLoading } = useMutation({
    mutationFn: async (text) => {
      const userMsg = { type: 'user', content: text };
      await saveMessageToServer(userMsg);

      const isContextualQuestion = /היא|בה|עליה|כדאי להשקיע|מה דעתך עליה|מה אתה חושב עלייה|זה|בו|בהם|בהן|לגביה|אליה/.test(text.toLowerCase());

      let context = null;
      if (isContextualQuestion) {
        context = inferContextFromMessages(messages);
        if (context) {
          const suffix =
            context.type === 'stock'
              ? ` (בהתייחס למניית ${context.value})`
              : context.type === 'topic'
              ? ` (בהקשר לנושא \"${context.value}\")`
              : ` (בהתייחס למה שנאמר קודם: \"${context.value}\")`;
          text = `${text}${suffix}`;
        }
      }

      console.log('Text לפני שליחה ל-Gemini:', text);
      console.log('Context מזוהה:', context);

      let botResponse;
      const advQuery = parseAdvancedStockQuery(text); 
      if (advQuery) {
        const { ticker, year, mode } = advQuery;
        const url = `/stocks/year?ticker=${ticker}&year=${year}&mode=${mode}`;
        const { data } = await axios.get(url);

        if (data.message === 'No data found') {
          botResponse = `לא נמצא מידע עבור ${ticker} בשנה ${year}`;
        } else if (mode === 'percentChange' && data.percentChange != null) {
          botResponse = `בשנת ${year} מניית ${ticker} השתנתה ב-${data.percentChange.toFixed(2)}% בין תחילת השנה לסופה.`;
        } else if (mode === 'priceOnly') {
          botResponse = `בשנת ${year} מניית ${ticker} החלה סביב ${data.firstClose} וסיימה סביב ${data.lastClose}.`;
        } else {
          botResponse = `קיבלתי נתונים: ${JSON.stringify(data)}`;
        }
      } else {
        const prompt = context ? `בהתייחס לשאלה הקודמת: \"${context.raw}\"\nשאלה נוכחית: ${text}` : text;
        botResponse = await sendQuestionToGeminiAI(prompt);
      }

      const botMsg = { type: 'bot', content: botResponse };
      await saveMessageToServer(botMsg);
      return [userMsg, botMsg];
    },
    onSuccess: (newMessages) => {
      queryClient.setQueryData(['chatMessages'], (old = []) => [...old, ...newMessages]);
    }
  });

  const { mutateAsync: clearChatMutation, isLoading: isDeleting } = useMutation({
    mutationFn: async () => deleteUserMessages(),
    onSuccess: () => queryClient.setQueryData(['chatMessages'], [])
  });

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

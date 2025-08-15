import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

const modelApiClient = axios.create({
  baseURL: 'https://model.medlead.ir/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

modelApiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// This interface now matches the history format
interface HistoryMessage {
  role: 'user' | 'model'; // Note the role is 'model' for the assistant
  content: string;
}

// The request body now includes both query and history
interface ChatRequest {
  query: string;
  history: HistoryMessage[];
}

// The response structure remains the same
interface ChatResponse {
  response: string
}

// The function now accepts the full history as an argument
export const sendMessageToAI = async (query: string, history: HistoryMessage[]): Promise<ChatResponse> => {
  const requestBody: ChatRequest = { query, history };
  const response = await modelApiClient.post<ChatResponse>('/chat', requestBody);
  return response.data;
}
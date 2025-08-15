import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { webSocketService } from '@/services/webSocketService'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
}

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  status: 'idle' | 'streaming' | 'error'
  isConnected: boolean
  searchQuery: string;
  
  // Actions
  startNewConversation: () => void
  selectConversation: (id: string) => void
  sendMessage: (messageContent: string) => void
  getCurrentConversation: () => Conversation | undefined
  setSearchQuery: (query: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  deleteConversation: (id: string) => void;
  
  // WebSocket specific actions
  connect: () => void
  disconnect: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      status: 'idle',
      isConnected: false,
      searchQuery: '',

      connect: () => {
        webSocketService.connect(
          () => set({ isConnected: true }),
          () => set({ isConnected: false })
        );
        
        webSocketService.onMessage((data) => {
          const { chunk, is_final } = data;
          
          set((state) => {
            const currentConvoId = state.currentConversationId;
            return {
              conversations: state.conversations.map(c => {
                if (c.id === currentConvoId) {
                  const lastMessage = c.messages[c.messages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content += chunk;
                  }
                  return { ...c };
                }
                return c;
              })
            };
          });

          if (is_final) {
            set({ status: 'idle' });
          }
        });
      },

      disconnect: () => {
        webSocketService.disconnect();
      },

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get()
        return conversations.find(c => c.id === currentConversationId)
      },

      startNewConversation: () => {
        const newConversation: Conversation = {
          id: uuidv4(),
          title: 'New Conversation',
          messages: [],
        }
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: newConversation.id,
        }))
      },

      selectConversation: (id: string) => {
        set({ currentConversationId: id })
      },

      sendMessage: (messageContent: string) => {
        let { currentConversationId, startNewConversation, getCurrentConversation } = get()
        
        if (!currentConversationId) {
          startNewConversation()
          currentConversationId = get().currentConversationId
        }
        
        const userMessage: Message = { role: 'user', content: messageContent }
        const currentHistory = getCurrentConversation()?.messages || []
        
        const assistantPlaceholder: Message = { role: 'assistant', content: '' };

        set((state) => ({
          conversations: state.conversations.map(c => {
            if (c.id === currentConversationId) {
                const newTitle = c.messages.length === 0 ? messageContent.substring(0, 30) + '...' : c.title;
                return { ...c, title: newTitle, messages: [...c.messages, userMessage, assistantPlaceholder] };
            }
            return c;
          }),
          status: 'streaming',
        }));

        webSocketService.sendMessage({
            query: messageContent,
            history: currentHistory.map(msg => ({
                ...msg,
                role: msg.role === 'assistant' ? 'model' : 'user',
            }))
        });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      renameConversation: (id: string, newTitle: string) => {
        set((state) => ({
          conversations: state.conversations.map(c => 
            c.id === id ? { ...c, title: newTitle } : c
          )
        }))
      },

      deleteConversation: (id: string) => {
        set((state) => ({
          conversations: state.conversations.filter(c => c.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }))
      },
    }),
    {
      name: 'medlead-chat-storage', 
    },
  ),
)
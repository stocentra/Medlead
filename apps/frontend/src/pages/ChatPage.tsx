import ChatInput from '@/components/features/chat/ChatInput'
import ChatMessages from '@/components/features/chat/ChatMessages'
import { useChatStore } from '@/store/useChatStore'
import { useEffect } from 'react'
import { Icon } from '@iconify/react'

const ChatPage = () => {
  // Get the state and actions directly from our WebSocket-enabled chat store
  const { 
    status, 
    sendMessage, 
    getCurrentConversation, 
    startNewConversation,
    currentConversationId,
    connect, // Action to establish WebSocket connection
    disconnect // Action to close WebSocket connection
  } = useChatStore()

  const isLoading = status === 'streaming'
  const currentConversation = getCurrentConversation()

  // This effect manages the WebSocket connection lifecycle
  useEffect(() => {
    // Connect when the component mounts
    connect();

    // Disconnect when the component unmounts (e.g., user navigates away or logs out)
    return () => {
      disconnect();
    }
  }, [connect, disconnect]);

  // This effect ensures there is always an active conversation
  useEffect(() => {
    if (!currentConversationId) {
      startNewConversation()
    }
  }, [currentConversationId, startNewConversation])

  // If there's no conversation (e.g., initial state before the first one is created)
  // show a welcome message.
  if (!currentConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <Icon icon="lucide:bot" className="h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold">Welcome to MedLead</h2>
        <p className="text-text-secondary">
          Start a new conversation from the sidebar to begin.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <ChatMessages 
        messages={currentConversation.messages} 
        isLoading={isLoading} 
      />

      <div className="mt-auto px-4 pb-4 sm:px-0">
        <ChatInput 
          onSendMessage={sendMessage} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  )
}

export default ChatPage
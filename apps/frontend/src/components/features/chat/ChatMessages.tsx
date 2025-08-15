import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator' // Import the new component

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean // Add isLoading prop
}

const ChatMessages = ({ messages, isLoading }: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading]) // Also scroll when loading indicator appears

  return (
    <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={index}
          role={message.role}
          content={message.content}
        />
      ))}
      {/* Conditionally render the typing indicator */}
      {isLoading && <TypingIndicator />}
    </div>
  )
}

export default ChatMessages
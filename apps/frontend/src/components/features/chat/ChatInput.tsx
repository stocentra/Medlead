import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Button } from '@/components/ui/Button'
import { Icon } from '@iconify/react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState('')

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex w-full items-center space-x-2 rounded-lg border bg-background p-2 shadow-sm">
      {/* 1. Add a screen-reader-only label */}
      <label htmlFor="chat-input" className="sr-only">
        Type your message
      </label>
      <TextareaAutosize
        id="chat-input" // 2. Add id to connect the label
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Ask MedLead anything..."
        maxRows={5}
        className="flex-1 resize-none self-center border-none bg-transparent p-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-0"
        disabled={isLoading}
      />
      <Button
        size="icon"
        onClick={handleSendMessage}
        disabled={isLoading || !message.trim()}
        aria-label="Send message" // 3. Add aria-label for the icon button
      >
        {isLoading ? (
          <Icon icon="lucide:loader" className="h-5 w-5 animate-spin" />
        ) : (
          <Icon icon="lucide:send" className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}

export default ChatInput
import { cn } from '@/lib/utils'
import { useTypewriter } from '@/hooks/useTypewriter'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

const MessageBubble = ({ role, content }: MessageBubbleProps) => {
  const isUser = role === 'user'
  
  // Use the typewriter effect only for the assistant's messages
  const displayedContent = isUser ? content : useTypewriter(content, 20)

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-md',
          isUser
            ? 'rounded-br-none bg-primary text-white'
            : 'rounded-bl-none border bg-background text-text-primary',
        )}
      >
        {/* Use a whitespace-pre-wrap to respect newlines in the AI's response */}
        <p className="whitespace-pre-wrap">{displayedContent}</p>
      </div>
    </div>
  )
}

export default MessageBubble
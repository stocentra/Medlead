import RodOfAsclepius from '@/assets/svgs/RodOfAsclepius'

const TypingIndicator = () => {
  return (
    <div className="flex w-full justify-start">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-md">
        <RodOfAsclepius className="h-6 w-6 animate-pulse text-primary" />
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
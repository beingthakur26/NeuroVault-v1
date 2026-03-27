import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

export default function ChatView() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Second Brain AI. Ask me anything about the links, notes, and videos you have saved.' }
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)
  const { getToken } = useAuth()

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    const token = await getToken()
    
    // Add an empty assistant message to stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('http://localhost:5000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      if (!response.ok) throw new Error("Network response was not ok")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6)
              if (dataStr === '[DONE]') {
                setIsStreaming(false)
                break;
              }
              try {
                const data = JSON.parse(dataStr)
                if (data.content) {
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1].content += data.content
                    return newMessages
                  })
                } else if (data.error) {
                  console.error(data.error)
                  setIsStreaming(false)
                }
              } catch (err) {
                console.error("SSE JSON Parse skipped:", err)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat fetch error:", error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1].content = "Sorry, I encountered an error connecting to your Brain."
        return newMessages
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto p-4 w-full">
      <div className="flex-1 overflow-y-auto space-y-6 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-[85%] space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>

              <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#1a1a1a] border border-white/10 text-gray-200 rounded-tl-none leading-relaxed'}`}>
                {msg.content ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4 border-t border-white/10 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask your Second Brain..."
            className="w-full bg-[#111] border border-white/10 focus:border-purple-500 rounded-full py-4 pl-6 pr-14 text-white outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 rounded-full text-white transition-colors flex items-center justify-center"
          >
            {isStreaming ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-3">Mistral AI utilizes Semantic Search to retrieve your saved notes.</p>
      </div>
    </div>
  )
}

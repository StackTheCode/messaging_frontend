
import { useEffect, useRef, useState } from 'react';
import '../src/index.css'
import { WsClient } from './wsClient';
interface ChatMessage {
  senderId: number;
  recipientId?: number;
  content: string;
  messageType: 'CHAT' | 'JOIN' | 'LEAVE';
}

const ChatbotApp = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const wsRef = useRef<WsClient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
       const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');



    if (!storedToken || !storedUserId) return;

setToken(storedToken)
    const numericUserId = Number(storedUserId);
setUserId(numericUserId)

   const wsClient = new WsClient(storedToken, numericUserId);
    wsRef.current = wsClient;
    wsClient.connect(
      (msg) => setMessages((prev) => [...prev, JSON.parse(msg.body)]),
      (msg) => setMessages((prev) => [...prev, JSON.parse(msg.body)])
    );

    return () => {
      wsClient.disconnect();
    };
  }, [])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || userId === null) return;

    const chatMessage: ChatMessage = {
      senderId: userId,
      content: input,
      messageType: 'CHAT'
    };

    wsRef.current.send(chatMessage);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#D0E6FD] p-4 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-4 text-blue-800">Chat Room</h2>

      <div className="w-full max-w-2xl flex flex-col flex-grow h-[70vh]">
        <div className="flex-1 overflow-y-auto border border-blue-300 rounded-lg p-3 bg-[#EFEFEF] shadow-inner">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <span className="font-semibold text-blue-700">{msg.senderId}:</span>{' '}
              <span>{msg.content}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-grow border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatbotApp;

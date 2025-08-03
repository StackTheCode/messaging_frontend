import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, User } from '../types/types';

interface ChatWindowProps {
  messages: ChatMessage[];
  selectedUser: User | null;
  currentUser: number | null;
  onSendMessage: (content: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, selectedUser, currentUser, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const filteredMessages = messages.filter(
    msg => (msg.senderId === currentUser && msg.recipientId === selectedUser?.id) || 
           (msg.senderId === selectedUser?.id && msg.recipientId === currentUser)
  );

  return (
    <div className="flex-1 flex flex-col">
      {selectedUser ? (
        <>
          <div className="p-4 border-b border-gray-300 bg-white shadow-sm">
            <h3 className="text-xl font-bold">Chatting with: {selectedUser.username}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.senderId === currentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-3 rounded-xl shadow-md ${msg.senderId === currentUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-300 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-grow border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Message ${selectedUser.username}...`}
              />
              <button
                onClick={handleSend}
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
          Select a user to start a conversation.
        </div>
      )}
    </div>
  );
};
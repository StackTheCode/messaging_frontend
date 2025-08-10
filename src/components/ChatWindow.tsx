import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, User } from '../types/types';
import type { WsClient } from '../wsClient';
import { useDebounce } from '../hooks/useDebounce';

interface ChatWindowProps {
  messages: ChatMessage[];
  selectedUser: User | null;
  currentUser: number | null;
  onSendMessage: (content: string) => void;
  wsRef: React.RefObject<WsClient | null>;
  isOtherUserTyping: boolean,
  onClearHistory: (user1Id: number, user2Id: number) => void;

}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages,
  selectedUser,
  currentUser,
  onSendMessage,
  wsRef,
  isOtherUserTyping,
  onClearHistory
}) => {

  const [input, setInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null);

  const sendTypingStatus = (typingStatus: boolean) => {
    if (wsRef.current && selectedUser && currentUser) {
      const payload = {
        senderId: currentUser,
        recipientId: selectedUser.id,
        typing: typingStatus,
      };
      wsRef.current.send({
        destination: '/app/chat.typing',
        body: JSON.stringify(payload),
      });
    }
  }
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        sendTypingStatus(false);
      }
    };
  }, [selectedUser]);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Only send typing status if there's actual content
    if (e.target.value.trim()) {
      // Send typing started
      sendTypingStatus(true);

      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set new timeout to stop typing after 1 second of inactivity
      const timeout = setTimeout(() => {
        sendTypingStatus(false);
      }, 1000);

      setTypingTimeout(timeout);
    } else {
      // If input is empty, stop typing immediately
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      sendTypingStatus(false);
    }
  };

  const handleClearHistory = () => {
    if (currentUser !== null && selectedUser !== null) {
      const confirmClear = window.confirm("Are you sure you want to delete this chat history ? This action cannot be undone")
      if (confirmClear) {
        onClearHistory(currentUser, selectedUser.id)
        setMenuOpen(false)
      }
    }
  }


  const handleSend = () => {
    if (input.trim()) {
      // Clear typing timeout and send stop typing
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      sendTypingStatus(false);

      onSendMessage(input);
      setInput('');
    }
  };

  const handleInputBlur = () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    sendTypingStatus(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
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
          <div className="p-4 border-b border-gray-300 bg-white shadow-sm flex items-center justify-between relative">
            <div className="flex items-center">
              <h3 className="text-xl font-bold">{selectedUser.username.toLocaleUpperCase()}</h3>
              {isOtherUserTyping && <span className='text-xl text-gray-500 z-30'>Typing...</span>}
            </div>
            <div className='relative' ref={menuRef} >
              <button onClick={() => setMenuOpen(!menuOpen)}
                className='p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
                aria-label='Chat options'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-600">
                  <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1 -3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1 -3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1 -3 0Z" clipRule="evenodd" />
                </svg>
              </button>

              {menuOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10'>
                  <button className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                    onClick={handleClearHistory}
                  >
                    Clear History
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredMessages.map((msg, i) => {
              const messageTime = msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''; return (
                  <div
                    key={i}
                    className={`flex ${msg.senderId === currentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md p-3 rounded-xl shadow-md
                         ${msg.senderId === currentUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
                    >
                      <p>{msg.content}</p>
                      {messageTime && (
                        <span className={`text-xs mt-1 block ${msg.senderId === currentUser ? 'text-white' : 'text-gray-500'}`}>
                          {messageTime}
                        </span>
                      )}
                    </div>
                  </div>
                )
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-300 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleInputBlur}
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
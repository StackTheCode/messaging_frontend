import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types/types';
import paperclip from '../assets/clip.svg'
import fileIcon from '../assets/fileIcon.svg'
import type { ChatWindowProps } from '../types/types';

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages,
  selectedUser,
  currentUser,
  onSendMessage,
  wsRef,
  isOtherUserTyping,
  onClearHistory,
  onNewFileMessage
}) => {

  const [input, setInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('');




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
  }, [selectedUser,typingTimeout]);



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


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !wsRef.current || !selectedUser || !currentUser) return;

    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error("Authentication token not found")
        return;
      }
      const response = await fetch('http://localhost:8080/api/files/upload', {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`File upload failed! Status: ${response.status}`)
      }
      const fileUrl = await response.text();
      const fileMessage: ChatMessage = {
        senderId: currentUser,
        recipientId: selectedUser.id,
        content: fileUrl,
        filename: file.name,
        messageType: "FILE",
        timestamp: new Date().toISOString()
      }
      onNewFileMessage(fileMessage)
    } catch (error) {
      console.error("File upload error:", error);

    }
    finally {
      event.target.value = '';

    }
  }
  const openImageModal = (imageUrl: string) => {
    setModalImageUrl(imageUrl)
    setImageModalOpen(true)
  }

  const closeImageModal = () => {
    setModalImageUrl('')
    setImageModalOpen(false)
  }

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
          <div className="p-6 border-b border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-between relative">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-light tracking-wide text-gray-700">{selectedUser.username.toLocaleUpperCase()}</h3>
              {isOtherUserTyping && <span className='text-lg text-gray-400 font-light'>Typing...</span>}
            </div>
            <div className='relative' ref={menuRef} >
              <button onClick={() => setMenuOpen(!menuOpen)}
                className='p-2 rounded-2xl hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-gray-200/30 transition-all duration-300'
                aria-label='Chat options'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-600">
                  <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1 -3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1 -3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1 -3 0Z" clipRule="evenodd" />
                </svg>
              </button>

              {menuOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-black/5 z-10'>
                  <button className='block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-white/20 rounded-2xl font-light transition-all duration-300'
                    onClick={handleClearHistory}
                  >
                    Clear History
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredMessages.map((msg, i) => {
              const messageTime = msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              const isSender = msg.senderId === currentUser;
              return (
                <div
                  key={i}
                  className={`flex ${msg.senderId === currentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md p-3 rounded-xl shadow-md ${isSender ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
                  >
                    {msg.messageType === 'FILE' ? (
                      <div className="flex flex-col items-start">
                        {msg.filename && msg.filename.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          
                          <img 
                            src={msg.content} 
                            alt={msg.filename} 
                            className="max-w-xs max-h-64 rounded-lg cursor-pointer object-cover" 
                            onClick={() => openImageModal(msg.content)}
                          />
                        ) : (
                          
                          <a 
                            href={msg.content} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`flex items-center text-sm font-medium ${isSender ? 'text-white' : 'text-blue-600'} hover:underline`}
                          >
                            <img src={fileIcon} className="inline-block mr-2 text-lg" />
                            <span>{msg.filename || 'Unknown File'}</span>
                          </a>
                        )}
                        {msg.filename && ( // Display original filename below image/link
                            <span className={`text-xs mt-1 ${isSender ? 'text-blue-200' : 'text-gray-500'} italic`}>
                                {msg.filename}
                            </span>
                        )}
                      </div>
                    ) : (
                      // Original logic for text messages
                      <p className='font-normal'>{msg.content}</p>
                    )}

                    {messageTime && (
                      <span className={`text-xs mt-1 block ${isSender ? 'text-white' : 'text-gray-500'}`}>
                        {messageTime}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-md">
            <div className="flex gap-3">
              <input
                type="file"
                id='file-upload'
                style={{ display: 'none' }}
                onChange={handleFileChange} />
              <label htmlFor="file-upload"
                className="p-3 bg-gray-200/50 hover:bg-gray-300/50 rounded-full cursor-pointer transition-all duration-300 flex-shrink-0">
                <img src={paperclip} className="h-5 w-5 text-gray-700" />
              </label>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleInputBlur}
                className="flex-grow bg-white/30 backdrop-blur-sm border border-white/20 rounded-3xl px-5 py-3 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 font-md"
                placeholder={`Message ${selectedUser.username}...`}
              />
              <button
                onClick={handleSend}
                className="px-8 py-3 bg-blue-500 cursor-pointer backdrop-blur-sm text-white rounded-3xl hover:bg-blue-600 transition-all duration-300 font-light tracking-wide border border-gray-700/30"
              >
                Send
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-lg font-light tracking-wide">
          Select a user to start a conversation.
        </div>
      )}
        {imageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeImageModal} 
        >
          <div className="relative p-4 bg-white rounded-lg max-w-3xl max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={closeImageModal} 
              className="absolute top-2 right-2 text-gray-800 text-2xl font-bold hover:text-gray-600"
            >
              &times;
            </button>
            <img src={modalImageUrl} alt="Full size" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
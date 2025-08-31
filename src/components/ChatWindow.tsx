import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types/types';
import type { ChatWindowProps } from '../types/types';
import { ArrowLeft, CheckSquare, FileText, MoreVertical, Paperclip, Send, X } from 'lucide-react';
import { useTask } from '../contexts/TaskContext'; // Import task context
import { MessageContextMenu } from './MessageContextMenu';// Import context menu

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages,
  selectedUser,
  currentUser,
  onSendMessage,
  wsRef,
  isOtherUserTyping,
  onClearHistory,
  onNewFileMessage,
  showUserList,
  setShowUserList,
}) => {

  const [input, setInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('');


  // Task-related state
  const { tasks, tasksPanelOpen, toggleTasksPanel } = useTask();
  const [contextMenu, setContextMenu] = useState<{
    message: ChatMessage;
    position: { x: number; y: number };
    isVisible: boolean;
  }>({
    message: {} as ChatMessage,
    position: { x: 0, y: 0 },
    isVisible: false
  });

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
  }, [selectedUser, typingTimeout]);



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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/files/upload`, {
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
        id: Date.now(),
        senderId: currentUser,
        recipientId: selectedUser.id,
        content: fileUrl,
        fileName: file.name,
        messageType: "FILE",
        timestamp: new Date().toISOString()
      }
      onNewFileMessage(fileMessage)
      wsRef.current.send({
        destination: '/app/chat.send',
        body: JSON.stringify(fileMessage),
      });
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
  // Mobile navigation function
  const handleBackToUsers = () => {
    setShowUserList(true);
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, message: ChatMessage) => {
    e.preventDefault();
    setContextMenu({
      message,
      position: { x: e.clientX, y: e.clientY },
      isVisible: true
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  };

  const filteredMessages = messages.filter(
    msg => (msg.senderId === currentUser && msg.recipientId === selectedUser?.id) ||
      (msg.senderId === selectedUser?.id && msg.recipientId === currentUser)
  );
  const filteredTasks = tasks.filter(task => {
    const relatedMessage = filteredMessages.find(msg => msg.id === task.messageId);
    return relatedMessage !== undefined;
  });

    return (
    <div className="flex-1 flex flex-col w-full lg:w-3/4 h-full">
      {selectedUser ? (
        <>
          {/* Header */}
          <div className="flex-shrink-0 p-4 lg:p-6 border-b border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-between relative">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToUsers}
                className="lg:hidden p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                aria-label="Back to users"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 lg:hidden">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-500/80 text-white text-sm font-light">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg lg:text-xl font-light tracking-wide text-gray-700">
                    {selectedUser.username.toLocaleUpperCase()}
                  </h3>
                  {isOtherUserTyping && (
                    <span className='text-sm lg:text-lg text-gray-400 font-light'>Typing...</span>
                  )}
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              {/* Task Panel Toggle Button */}
              <button
                onClick={toggleTasksPanel}
                className={`p-2 rounded-2xl transition-all duration-300 ${tasksPanelOpen
                  ? 'bg-blue-500/20 text-blue-600'
                  : 'hover:bg-white/20 text-gray-600'
                  }`}
                title="Toggle Tasks"
                aria-label="Toggle task panel"
              >
                <CheckSquare className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>

              <div className='relative' ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className='p-2 rounded-2xl hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-gray-200/30 transition-all duration-300'
                  aria-label='Chat options'
                >
                  <MoreVertical className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                </button>

                {menuOpen && (
                  <div className='absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-black/5 z-10'>
                    <button
                      className='block w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-white/20 rounded-2xl font-light transition-all duration-300'
                      onClick={handleClearHistory}
                    >
                      Clear History
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex min-h-0">
            {/* Chat Messages Area */}
            <div className={`flex-1 flex flex-col min-h-0 ${tasksPanelOpen ? 'lg:w-2/3' : 'w-full'}`}>
              {/* Messages Container - Fixed scrolling */}
              <div 
                className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4"
                onClick={handleCloseContextMenu}
              >
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
                        className={`max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg p-3 rounded-xl shadow-md cursor-pointer ${isSender
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-800 rounded-bl-none'
                          }`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContextMenu(e, msg);
                        }}
                      >
                        {msg.messageType === 'FILE' ? (
                          <div className="flex flex-col items-start">
                            {msg.fileName && msg.fileName.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                              <img
                                src={msg.content}
                                alt={msg.fileName}
                                className="max-w-full max-h-48 lg:max-h-64 rounded-lg cursor-pointer object-cover"
                                onClick={() => openImageModal(msg.content)}
                              />
                            ) : (
                              <a
                                href={msg.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center text-sm font-medium ${isSender ? 'text-white' : 'text-blue-600'
                                  } hover:underline`}
                              >
                                <FileText className="inline-block mr-2 text-base lg:text-lg flex-shrink-0" />
                                <span className="truncate">{msg.fileName || 'Unknown File'}</span>
                              </a>
                            )}
                            {msg.fileName && (
                              <span className={`text-xs mt-1 ${isSender ? 'text-blue-200' : 'text-gray-500'
                                } italic truncate max-w-full`}>
                                {msg.fileName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className='font-normal text-sm lg:text-base break-words'>{msg.content}</p>
                        )}

                        {messageTime && (
                          <span className={`text-xs mt-1 block ${isSender ? 'text-white' : 'text-gray-500'
                            }`}>
                            {messageTime}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 p-3 lg:p-4 border-t border-white/20 bg-white/10 backdrop-blur-md">
                <div className="flex gap-2 lg:gap-3">
                  <input
                    type="file"
                    id='file-upload'
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className="p-2 lg:p-3 bg-gray-200/50 hover:bg-gray-300/50 rounded-full cursor-pointer transition-all duration-300 flex-shrink-0"
                  >
                    <Paperclip className="h-4 w-4 lg:h-5 lg:w-5 text-gray-700" />
                  </label>

                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleInputBlur}
                    className="flex-grow bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl lg:rounded-3xl px-3 lg:px-5 py-2 lg:py-3 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 text-sm lg:text-base font-md"
                    placeholder={`Message ${selectedUser.username}...`}
                  />

                  <button
                    onClick={handleSend}
                    className="px-4 lg:px-8 py-2 lg:py-3 bg-blue-500 cursor-pointer backdrop-blur-sm text-white rounded-2xl lg:rounded-3xl hover:bg-blue-600 transition-all duration-300 font-light tracking-wide border border-gray-700/30 text-sm lg:text-base"
                  >
                    <span className="hidden sm:inline">Send</span>
                    <Send className="h-4 w-4 sm:hidden" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks Panel */}
            {tasksPanelOpen && (
              <div className="w-full lg:w-1/3 border-l border-white/20 bg-white/10 backdrop-blur-sm flex flex-col min-h-0">
                <div className="flex-shrink-0 p-4 border-b border-white/20 flex items-center justify-between">
                  <h3 className="text-lg font-light tracking-wide text-gray-700">Tasks</h3>
                  <button
                    onClick={toggleTasksPanel}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-light">No tasks yet</p>
                      <p className="text-sm text-gray-400 mt-1 font-light">
                        Right-click on any message to create a task
                      </p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-white/20 rounded-xl border border-white/20"
                      >
                        <h4 className="font-medium text-gray-800 mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2 font-light">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-1 rounded-full font-light ${task.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full font-light ${task.priority === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500 mt-2 font-light">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-base lg:text-lg font-light tracking-wide p-4">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 rounded-full bg-gray-200/50 flex items-center justify-center">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <p className="px-4">Select a user to start a conversation.</p>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <MessageContextMenu
        message={contextMenu.message}
        position={contextMenu.position}
        onClose={handleCloseContextMenu}
        isVisible={contextMenu.isVisible}
      />

      {/* Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative p-2 lg:p-4 bg-white rounded-lg max-w-full max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute top-1 right-1 lg:top-2 lg:right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200 z-10"
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            <img src={modalImageUrl} alt="Full size" className="max-w-full max-h-[85vh] lg:max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
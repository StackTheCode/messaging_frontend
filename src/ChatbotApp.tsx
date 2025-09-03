
import { useCallback, useEffect, useRef, useState } from 'react';
import '../src/index.css'
import type { ChatMessage, User, TypingStatusMessage } from './types/types';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import type { IMessage } from '@stomp/stompjs';
import { useDebounce } from './hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'; // Import the new components
import { TaskProvider } from './contexts/TaskContext';
import { userService } from './hooks/userService';
import { messageService } from './services/messageService';
import { webSocketService } from './services/webSocketService';
const ChatbotApp = () => {
  
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const selectedUserRef = useRef<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

 
 // Mobile responsiveness state
  const [showUserList, setShowUserList] = useState(true);
  // --- Initial Setup (Token/UserId from localStorage) ---
    useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    if (!storedToken || !storedUserId) return;

    if (isNaN(Number(storedUserId))) {
      console.error("Invalid userId in localStorage");
      return;
    }

    setToken(storedToken);
    setUserId(parseInt(storedUserId, 10));
  }, []);

  // Keep selectedUserRef in sync with selectedUser
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // WebSocket connection management
  useEffect(() => {
    if (!token || !userId) return;

const handlePrivateMessage = (message: IMessage) => {
  const serverMessage: ChatMessage = JSON.parse(message.body);

  setMessages(prev => {
    // ищем pending сообщение по sender/recipient/content/type
    const pendingIndex = prev.findIndex(
      msg =>
        msg.pending &&
        msg.senderId === serverMessage.senderId &&
        msg.recipientId === serverMessage.recipientId &&
        msg.content === serverMessage.content &&
        msg.messageType === serverMessage.messageType
    );

    if (pendingIndex !== -1) {
      // заменяем pending на серверное
      const newMessages = [...prev];
      newMessages[pendingIndex] = { ...serverMessage, pending: false };
      return newMessages;
    } else {
      // это новое сообщение от собеседника
      return [...prev, serverMessage];
    }
  });
};




    const handlePublicMessage = (msg: IMessage) => {
      setMessages(prev => [...prev, JSON.parse(msg.body)]);
    };

    const handleTypingStatus = (msg: IMessage) => {
      const typingStatus: TypingStatusMessage = JSON.parse(msg.body);
      const activeUser = selectedUserRef.current;

      if (activeUser && typingStatus.senderId === activeUser.id && typingStatus.senderId !== userId) {
        setIsOtherUserTyping(typingStatus.typing);
      }
    };

    webSocketService.connect(token, userId, handlePrivateMessage, handlePublicMessage, handleTypingStatus);

    return () => {
      webSocketService.disconnect();
    };
  }, [token, userId]);

  // Fetch users with debounced search
  const fetchUsers = useCallback(async (query: string) => {
    if (!token) return;

    try {
      const fetchedUsers = query 
        ? await userService.searchUsers(query) 
        : await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [token]);

  const debouncedFetchUsers = useDebounce(fetchUsers, 300);

  useEffect(() => {
    if (token) {
      debouncedFetchUsers(searchQuery);
    }
  }, [searchQuery, token, debouncedFetchUsers]);

  // Fetch chat history when selected user changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!userId || !selectedUser || !token) {
        setMessages([]);
        return;
      }

      try {
        const historyData = await messageService.getChatHistory(userId, selectedUser.id);
        setMessages(historyData);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setMessages([]);
      }
    };

    fetchChatHistory();
  }, [selectedUser, userId, token]);

  // Reset typing status when conversation changes
  useEffect(() => {
    setIsOtherUserTyping(false);
  }, [selectedUser]);

  // Handlers
const handleSendMessage = useCallback((content: string) => {
  if (!content.trim() || !userId || !selectedUser) return;

  // создаём pending сообщение
  const chatMessage: ChatMessage = {
    id: Date.now(),                // временный ID
    senderId: userId,
    recipientId: selectedUser.id,
    content,
    messageType: "CHAT",
    timestamp: new Date().toISOString(),
    pending: true
  };

  // отображаем сразу
  setMessages(prev => [...prev, chatMessage]);

  // готовим сообщение к серверу (без временного id и pending)
  const messageToSend = { ...chatMessage };
  delete messageToSend.id;
  delete messageToSend.pending;

  webSocketService.sendMessage(messageToSend);
}, [userId, selectedUser]);


  const handleClearHistory = useCallback(async (user1Id: number, user2Id: number) => {
    try {
      const success = await messageService.clearChatHistory(user1Id, user2Id);
      if (success) {
        setMessages([]);
        console.log(`Chat history cleared between ${user1Id} and ${user2Id}`);
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  }, []);

  const handleLogOut = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setUserId(null);
    setSelectedUser(null);
    setMessages([]);
    setUsers([]);
    webSocketService.disconnect();
    navigate('/');
  }, [navigate]);

  const handleNewFileMessage = useCallback((message: ChatMessage) => {
    setMessages(prevMessages => [...prevMessages, message]);
  }, []);

  const sendTypingStatus = useCallback((recipientId: number, typing: boolean) => {
    webSocketService.sendTypingStatus(recipientId, typing);
  }, []);

  return (
        <TaskProvider>
   <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
            <PanelGroup direction="horizontal">
                {/* The UserList Panel */}
                <Panel
                    className={`${showUserList ? 'flex' : 'hidden'} lg:flex w-full lg:w-auto flex-col`}
                    defaultSize={25}
                    minSize={15}
                >
                    <UserList
                        users={users}
                        selectedUser={selectedUser}
                        onSelectUser={(user) => {
                            setSelectedUser(user);
                            setShowUserList(false);
                        }}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        currentUser={userId}
                        handleLogout={handleLogOut}
                    />
                </Panel>
                
                {/* The Resize Handle, only visible on large screens */}
                <PanelResizeHandle className="w-2 bg-gray-300 hover:bg-gray-400 transition-colors duration-200 cursor-col-resize hidden lg:block" />

                {/* The ChatWindow Panel */}
                <Panel
                    className={`${!showUserList ? 'flex' : 'hidden'} lg:flex flex-1`}
                    minSize={50}
                >
                    <ChatWindow
                    sendTypingStatus={sendTypingStatus}
                        messages={messages}
                        selectedUser={selectedUser}
                        currentUser={userId}
                        onSendMessage={handleSendMessage}
                        isOtherUserTyping={isOtherUserTyping}
                        onClearHistory={handleClearHistory}
                        onNewFileMessage={handleNewFileMessage}
                        showUserList={showUserList}
                        setShowUserList={setShowUserList}
                    />
                </Panel>
            </PanelGroup>
        </div>
        </TaskProvider> 
  )
}

export default ChatbotApp;

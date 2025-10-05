import { useCallback, useEffect, useRef, useState } from 'react';
import '../src/index.css'
import type { ChatMessage, User, TypingStatusMessage, ConversationUser } from './types/types';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import type { IMessage } from '@stomp/stompjs';
import { useDebounce } from './hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TaskProvider } from './contexts/TaskContext';
import { userService } from './hooks/userService';
import { messageService } from './services/messageService';
import { webSocketService } from './services/webSocketService';

const ChatbotApp = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ConversationUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
const [currentUserData, setCurrentUserData] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const selectedUserRef = useRef<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mobile responsiveness state
  const [showUserList, setShowUserList] = useState(true);

  useEffect(() => {
  if (!token || !userId) return;

  (async () => {
    try {
      const me = await userService.getUserById(userId);
      setCurrentUserData(me); // set state with full user object
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  })();
}, [token, userId]);

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

  // WebSocket connection management - SINGLE CONNECTION
  useEffect(() => {
    if (!token || !userId) return;

    const handlePrivateMessage = (message: IMessage) => {
      const serverMessage: ChatMessage = JSON.parse(message.body);

      setMessages(prev => {
        // Find pending message by sender/recipient/content/type
        const pendingIndex = prev.findIndex(
          msg =>
            msg.pending &&
            msg.senderId === serverMessage.senderId &&
            msg.recipientId === serverMessage.recipientId &&
            msg.content === serverMessage.content &&
            msg.messageType === serverMessage.messageType
        );

        if (pendingIndex !== -1) {
          // Replace pending with server message
          const newMessages = [...prev];
          newMessages[pendingIndex] = { ...serverMessage, pending: false };
          return newMessages;
        } else {
          // New message from other user
          return [...prev, serverMessage];
        }
      });
    };
    fetchConversationPartners();
    const handlePublicMessage = (msg: IMessage) => {
      setMessages(prev => [...prev, JSON.parse(msg.body)]);
    };


    const handleTypingStatus = (msg: IMessage) => {
      const typingStatus: TypingStatusMessage = JSON.parse(msg.body);
      const activeUser = selectedUserRef.current;
      if (activeUser &&
        typingStatus.senderId === activeUser.id &&
        typingStatus.senderId !== userId) {

        console.log('Typing status update:', typingStatus.typing, 'from user:', typingStatus.senderId);
        setIsOtherUserTyping(typingStatus.typing);

        // Auto-clear typing status after 3 seconds if stuck
        if (typingStatus.typing) {
          setTimeout(() => {
            setIsOtherUserTyping(prev => {
              if (prev && selectedUserRef.current?.id === typingStatus.senderId) {
                console.log('Auto-clearing typing status');
                return false;
              }
              return prev;
            });
          }, 3000);
        }
      }
    };

    //  Handle delete messages via WebSocket
    const handleDeleteMessage = (msg: IMessage) => {
      const deletePayload = JSON.parse(msg.body);
      const deletedId = deletePayload.id;

      console.log('WebSocket delete received for message ID:', deletedId);

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== deletedId);
        console.log('Messages before delete:', prev.length, 'After delete:', filtered.length);
        return filtered;
      });
    };

    // Connect with all 4 handlers including delete
    webSocketService.connect(
      token,
      userId,
      handlePrivateMessage,
      handlePublicMessage,
      handleTypingStatus,
      handleDeleteMessage // Add the delete handler
    );

    return () => {
      webSocketService.disconnect();
    };
  }, [token, userId]);

  const fetchConversationPartners = useCallback(async () => {
    if (!token) return;
    try {
      const partners = await userService.getConversationPartners(userId)
      setUsers(partners)
    } catch (error) {
      console.error("Error fetching conversation partners:", error);
    }
  }, [token, userId])


  // Fetch users with debounced search
  const fetchUsers = useCallback(async (query: string):Promise<User[]> => {
    if (!token) return [];

    try {
     return query
        ? await userService.searchUsers(query)
        : await userService.getUsers();
      
    } catch (error) {
      console.error("Error fetching users:", error);
      return []; 
    }
  }, [token]);

  const debouncedQuery= useDebounce(fetchUsers, 300);

useEffect(() => {
  if (!token) return;

  if (searchQuery.trim()) {
    debouncedQuery(searchQuery).then(setAllUsers);
  } else {
    setAllUsers([]);
    fetchConversationPartners();
  }
}, [searchQuery, token, debouncedQuery, fetchConversationPartners]);



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

        await messageService.markMessagesAsRead(selectedUser.id,userId);
          console.log('Marking messages as read:', selectedUser.id, userId); // Add this

      fetchConversationPartners();
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

    // Create pending message
    const chatMessage: ChatMessage = {
      id: Date.now(), // temporary ID
      senderId: userId,
      recipientId: selectedUser.id,
      content,
      messageType: "CHAT",
      timestamp: new Date().toISOString(),
      pending: true
    };

    // Display immediately
    setMessages(prev => [...prev, chatMessage]);

    // Prepare message for server (without temporary id and pending)
    const messageToSend = { ...chatMessage };
    delete messageToSend.id;
    delete messageToSend.pending;

    webSocketService.sendMessage(messageToSend);
    fetchConversationPartners();
  }, [userId, selectedUser,fetchConversationPartners]);

  // NEW: Centralized delete handler
  const handleDeleteMessage = useCallback(async (messageId: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      // Optimistic update - remove from UI immediately
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      const result = await messageService.deleteMessage(messageId);

      if (!result.success) {
        console.error("Failed to delete message:", result.error);
        // Revert optimistic update on failure
        const historyData = await messageService.getChatHistory(userId!, selectedUser!.id);
        setMessages(historyData);
        alert(result.error || "Failed to delete message");
      } else {
        console.log("Message deleted successfully");
        // WebSocket will broadcast the delete to other users
        // Our own UI is already updated optimistically
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      // Revert optimistic update on error
      if (userId && selectedUser) {
        const historyData = await messageService.getChatHistory(userId, selectedUser.id);
        setMessages(historyData);
      }
      alert("Failed to delete message.");
    }
  }, [userId, selectedUser]);

  const handleClearHistory = useCallback(async (user1Id: number, user2Id: number) => {
    try {
      const success = await messageService.clearChatHistory(user1Id, user2Id);
      if (success) {
        setMessages([]);
        fetchConversationPartners();
        console.log(`Chat history cleared between ${user1Id} and ${user2Id}`);
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  }, [fetchConversationPartners]);

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
    fetchConversationPartners()
  }, [fetchConversationPartners]);

  const sendTypingStatus = useCallback((recipientId: number, typing: boolean) => {
    webSocketService.sendTypingStatus(recipientId, typing);
  }, []);
  const handleSelectUserFromSearch = useCallback((user: User) => {
    setSelectedUser(user);
    setShowNewMessageModal(false);
    setShowUserList(false);
    setSearchQuery('');
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
              allUsers={allUsers}
              selectedUser={selectedUser}
              onSelectUser={(user) => {
                setSelectedUser(user);
                setShowUserList(false);
              }}
              onSelectUserFromSearch={handleSelectUserFromSearch}
              showNewMessageModal={showNewMessageModal}
              setShowNewMessageModal={setShowNewMessageModal}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              currentUser={userId}
              handleLogout={handleLogOut}
              currentUserData={currentUserData}
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
              onDeleteMessage={handleDeleteMessage} 
              
            />
          </Panel>
        </PanelGroup>
      </div>
    </TaskProvider>
  )
}

export default ChatbotApp;
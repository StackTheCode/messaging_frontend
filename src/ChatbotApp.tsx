
import { useCallback, useEffect, useRef, useState } from 'react';
import '../src/index.css'
import { WsClient } from './wsClient';
import type { ChatMessage, User, TypingStatusMessage } from './types/types';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import type { IMessage } from '@stomp/stompjs';
import { useDebounce } from './hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'; // Import the new components


const ChatbotApp = () => {
  
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const wsRef = useRef<WsClient | null>(null);
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
  }, []); // Runs once on mount


  // --- WebSocket Connection Management ---
  useEffect(() => {
    if (token === null || userId === null) return;

    // Disconnect existing client if it exists before creating a new one
    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    const wsClient = new WsClient(token, userId);
    wsRef.current = wsClient;

    const onPrivateMessage = (msg: IMessage) => setMessages((prev) => [...prev, JSON.parse(msg.body)]);
    const onPublicMessage = (msg: IMessage) => setMessages((prev) => [...prev, JSON.parse(msg.body)]);

    // This callback relies on selectedUserRef.current which is updated via another useEffect
    const onTypingStatusMessage = (msg: IMessage) => {
      const typingStatus: TypingStatusMessage = JSON.parse(msg.body);
      const activeUser = selectedUserRef.current; // Use the ref for the latest selected user

      if (activeUser && typingStatus.senderId === activeUser.id && typingStatus.senderId !== userId) {
        setIsOtherUserTyping(typingStatus.typing);
      }
    };

    wsClient.connect(onPrivateMessage, onPublicMessage, onTypingStatusMessage);

    // Cleanup function for WebSocket client
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [token, userId]);


  // --- Keep selectedUserRef always up-to-date with the latest selectedUser state ---
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);


  // --- Fetching Users (with Debounced Search) ---
  const fetchUsers = useCallback(async (query: string) => {
 
    if (!token) return;

    try {
      
      const url = query ? `${import.meta.env.VITE_API_URL}/api/users/search?query=${encodeURIComponent(query)}` : `${import.meta.env.VITE_API_URL}/api/users`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [token]);

  // Debounced version of fetchUsers using the custom useDebounce hook
  const debouncedFetchUsers = useDebounce(fetchUsers, 300);

  // Trigger debouncedFetchUsers whenever searchQuery changes
  useEffect(() => {
    if (token) { // Only fetch if token is available
      debouncedFetchUsers(searchQuery);
    }
  }, [searchQuery, token, debouncedFetchUsers]); // `debouncedFetchUsers` is a stable reference due to `useCallback`


  // --- Fetching Chat History ---
  useEffect(() => {
    
    const fetchChatHistory = async () => {
      const apiUrl =import.meta.env.VITE_API_URL

      if (userId !== null && selectedUser !== null && token) {
        try {
          const url = `${apiUrl}/api/messages/history/${userId}/${selectedUser.id}`;
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const historyData: ChatMessage[] = await response.json();
          setMessages(historyData);
        } catch (error) {
          console.error("Error fetching chat history:", error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };

    fetchChatHistory();

  }, [selectedUser, userId, token]); // Dependencies: Re-fetch when selectedUser, userId, or token changes


  // --- Reset Typing Status on Conversation Change ---
  useEffect(() => {
    setIsOtherUserTyping(false);
  }, [selectedUser]);


  // --- Send Message Handler (Memoized) ---
  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim() || !wsRef.current || userId === null || !selectedUser) return;

    const chatMessage: ChatMessage = {
      senderId: userId,
      recipientId: selectedUser.id,
      content: content,
      messageType: 'CHAT',
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, chatMessage]);

    wsRef.current.send({
      destination: '/app/chat.send',
      body: JSON.stringify(chatMessage),
    });
  }, [userId, selectedUser]); // Dependencies for handleSendMessage


  // --- Clear History Handler (Memoized) ---
  const handleClearHistory = useCallback(async (user1Id: number, user2Id: number) => {
    if (token) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/history/${user1Id}/${user2Id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`Failed to clear chat history: ${response.status}`);
        }

        setMessages([]);
        console.log(`Chat history cleared between ${user1Id} and ${user2Id}`);
      } catch (error) {
        console.error("Error clearing chat history:", error);
      }
    }
  }, [token]);



  const handleLogOut = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null)
    setUserId(null)
    setSelectedUser(null)
    setMessages([]);
    setUsers([]);
    if(wsRef.current){
      wsRef.current.disconnect()
    }
    navigate('/')
  }, [navigate])

  const handleNewFileMessage = useCallback((message: ChatMessage) => {
    setMessages(prevMessages => [...prevMessages, message]);
  }, []); // No dependencies needed as setMessages is stable


  return (
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
                        messages={messages}
                        selectedUser={selectedUser}
                        currentUser={userId}
                        onSendMessage={handleSendMessage}
                        wsRef={wsRef}
                        isOtherUserTyping={isOtherUserTyping}
                        onClearHistory={handleClearHistory}
                        onNewFileMessage={handleNewFileMessage}
                        showUserList={showUserList}
                        setShowUserList={setShowUserList}
                    />
                </Panel>
            </PanelGroup>
        </div>
  )
}

export default ChatbotApp;

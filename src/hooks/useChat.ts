import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, User, TypingStatusMessage } from '../types/types';
import { userService } from './userService';
import { messageService } from '../services/messageService';
import { webSocketService } from '../services/webSocketService';
import { useDebounce } from './useDebounce';
import type { IMessage } from '@stomp/stompjs';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUserList, setShowUserList] = useState(true);
  
  const selectedUserRef = useRef<User | null>(null);

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Initialize auth from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    
    if (!storedToken || !storedUserId || isNaN(Number(storedUserId))) return;

    setToken(storedToken);
    setUserId(parseInt(storedUserId, 10));
  }, []);

  // Keep selectedUserRef in sync
useEffect(() => {
  if (!token || !userId) return;

  const handlePrivateMessage = (message: IMessage) => {
    // STOMP's IMessage object has a 'body' which is a string
    // Parse the JSON string to get your ChatMessage object
    const chatMessage: ChatMessage = JSON.parse(message.body);
    setMessages(prev => [...prev, chatMessage]);
  };

  const handlePublicMessage = (message: IMessage) => {
    const chatMessage: ChatMessage = JSON.parse(message.body);
    setMessages(prev => [...prev, chatMessage]);
  };

  const handleTypingStatus = (typingStatus: IMessage) => {
    const activeUser = selectedUserRef.current;
    const typingPayload: TypingStatusMessage = JSON.parse(typingStatus.body);
    if (activeUser && typingPayload.senderId === activeUser.id && typingPayload.senderId !== userId) {
      setIsOtherUserTyping(typingPayload.typing);
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
      const users = query ? await userService.searchUsers(query) : await userService.getUsers();
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
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
        const history = await messageService.getChatHistory(userId, selectedUser.id);
        setMessages(history);
      } catch (error) {
        console.error('Error fetching chat history:', error);
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

    const chatMessage: ChatMessage = {
      // id: Date.now(),
      senderId: userId,
      recipientId: selectedUser.id,
      content: content,
      messageType: 'CHAT',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, chatMessage]);
    webSocketService.sendMessage(chatMessage);
  }, [userId, selectedUser]);

  const handleClearHistory = useCallback(async (user1Id: number, user2Id: number) => {
    try {
      const success = await messageService.clearChatHistory(user1Id, user2Id);
      if (success) {
        setMessages([]);
        console.log(`Chat history cleared between ${user1Id} and ${user2Id}`);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
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
  }, []);

  const sendTypingStatus = useCallback((recipientId: number, typing: boolean) => {
    webSocketService.sendTypingStatus(recipientId, typing);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  return {
    // State
    messages,
    users,
    selectedUser,
    isOtherUserTyping,
    searchQuery,
    showUserList,
    userId,
    token,
    
    // Setters
    setSelectedUser,
    setSearchQuery,
    setShowUserList,
    
    // Handlers
    handleSendMessage,
    handleClearHistory,
    handleLogOut,
    sendTypingStatus,
    addMessage,
  };
};
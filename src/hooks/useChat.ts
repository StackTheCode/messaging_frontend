import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, User, TypingStatusMessage } from '../types/types';
import { userService } from './userService';
import { messageService } from '../services/messageService';
import { useDebounce } from './useDebounce';

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
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // REMOVED: Duplicate WebSocket connection
  // The main ChatbotApp now handles the WebSocket connection

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

  // Handlers - SIMPLIFIED (no WebSocket management here)
  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim() || !userId || !selectedUser) return;

    const chatMessage: ChatMessage = {
      senderId: userId,
      recipientId: selectedUser.id,
      content: content,
      messageType: 'CHAT',
      timestamp: new Date().toISOString()
    };

    // Add to local state (this is now just for this hook's consumers)
    setMessages(prev => [...prev, chatMessage]);
    
    // Note: WebSocket sending should be handled by the main app
    // webSocketService.sendMessage(chatMessage);
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

  // MOVED: Delete handler moved to main ChatbotApp
  // This is just a placeholder that calls the parent's delete handler
  const handleDeleteMessage = useCallback(async (messageId: number) => {
    // This should be handled by the parent component that manages WebSocket
    console.log('Delete message called in useChat hook - this should be handled by parent');
    
    // For local state management only
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const handleLogOut = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setUserId(null);
    setSelectedUser(null);
    setMessages([]);
    setUsers([]);
    // Note: WebSocket disconnection should be handled by main app
  }, []);

  const sendTypingStatus = useCallback((recipientId: number, typing: boolean) => {
    // This should be handled by the parent component that manages WebSocket
    console.log('Typing status should be handled by parent component');
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
    handleDeleteMessage, // Simplified version
    sendTypingStatus,    // Simplified version
    addMessage,
  };
};
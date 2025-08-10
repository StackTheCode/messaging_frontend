
import { useEffect, useRef, useState } from 'react';
import '../src/index.css'
import { WsClient } from './wsClient';
import type { ChatMessage, User, TypingStatusMessage } from './types/types';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import type { IMessage } from '@stomp/stompjs';


const ChatbotApp = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const wsRef = useRef<WsClient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const selectedUserRef = useRef<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    if (!storedToken || !storedUserId) return;

    if (!storedToken || !storedUserId || isNaN(Number(storedUserId))) {
      console.error("Missing or invalid token/userId");
      return;
    }

    const numericUserId = parseInt(storedUserId, 10);
    setToken(storedToken)
    setUserId(numericUserId)

    const wsClient = new WsClient(storedToken, numericUserId);
    wsRef.current = wsClient;

    const onPrivateMessage = (msg: IMessage) => setMessages((prev) => [...prev, JSON.parse(msg.body)]);
    const onPublicMessage = (msg: IMessage) => setMessages((prev) => [...prev, JSON.parse(msg.body)]);


    const onTypingStatusMessage = (msg: IMessage) => {
      const typingStatus: TypingStatusMessage = JSON.parse(msg.body)
      const activeUser = selectedUserRef.current;

      if (activeUser && typingStatus.senderId === activeUser.id && typingStatus.senderId !== userId) {
        console.log("Other user is typing:", typingStatus);

        setIsOtherUserTyping(typingStatus.typing)
      }
    }

    wsClient.connect(onPrivateMessage, onPublicMessage, onTypingStatusMessage);

    const fetchUsers = async (query: string) => {
      try {
        const url = query ? `http://localhost:8080/api/users/search?query=${encodeURIComponent(query)}` : 'http://localhost:8080/api/users'
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (!response.ok) {
          throw new Error(`HTTP error ! Status:${response.status}`)
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    if(debounceTimeoutRef.current){
      clearTimeout(debounceTimeoutRef.current)
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchUsers(searchQuery)
    }, 300);


    return () => {
      wsClient.disconnect();
      if(debounceTimeoutRef.current){
        clearTimeout(debounceTimeoutRef.current)
      }
    };
  }, [userId,searchQuery])

  useEffect(() => {
    setIsOtherUserTyping(false)

  }, [selectedUser])

  useEffect(() => {
    selectedUserRef.current = selectedUser;

  }, [selectedUser])

  useEffect(() =>{
    const fetchChatHistory = async() =>{
      if(userId !== null && selectedUser !== null && token){
        try {
          const url = `http://localhost:8080/api/messages/history/${userId}/${selectedUser.id}`;
          const response = await fetch(url,{
            headers:{
               'Authorization': `Bearer ${token}` 
            }
          })
          if(!response.ok){
            throw new Error(`HTTP error ! Status :${response.status}`)
          }

          const historyData : ChatMessage[] =await response.json();
          setMessages(historyData);
        } catch (error) {
          console.error("Error fetching chat history: ", error);
          setMessages([])
        }
      }
      else{
        setMessages([]);
      }
    }
    fetchChatHistory();
  },[userId, selectedUser,token])

  const handleSendMessage = (content: string) => {
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
  };
const handleClearHistory = async (user1Id: number, user2Id: number) => {
    if (token) {
      try {
        const response = await fetch(`http://localhost:8080/api/messages/history/${user1Id}/${user2Id}`, {
          method: 'DELETE', // Use DELETE method
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`Failed to clear chat history: ${response.status}`);
        }

        // If successful, clear messages in local state
        setMessages([]); 
        console.log(`Chat history cleared between ${user1Id} and ${user2Id}`);
        // Optionally, you might want to send a WebSocket message to the other user
        // to inform them that the chat history has been cleared.
        // wsRef.current?.send({ destination: '/app/chat.historyCleared', body: JSON.stringify({ user1Id, user2Id }) });
      } catch (error) {
        console.error("Error clearing chat history:", error);
      }
    }
  };
  return (
    <div className="flex h-screen bg-gray-100">
      <UserList users={users}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        searchQuery = {searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={userId} />

      <ChatWindow messages={messages}
        selectedUser={selectedUser}
        currentUser={userId}
        onSendMessage={handleSendMessage}
        wsRef={wsRef}
        isOtherUserTyping={isOtherUserTyping} 
        onClearHistory={handleClearHistory}/>
    </div>
  )
}

export default ChatbotApp;


import { useEffect, useRef, useState } from 'react';
import '../src/index.css'
import { WsClient } from './wsClient';
import type { ChatMessage, User } from './types/types';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';


const ChatbotApp = () => {
 const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const wsRef = useRef<WsClient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

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
    wsClient.connect(
      (msg) => setMessages((prev) => [...prev, JSON.parse(msg.body)]),
      (msg) => setMessages((prev) => [...prev, JSON.parse(msg.body)])
    );

      fetch('http://localhost:8080/api/users', {
      headers: { 'Authorization': `Bearer ${storedToken}` }
    })
    .then(response => response.json())
    .then(data => setUsers(data));

    return () => {
      wsClient.disconnect();
    };
  }, [])

const handleSendMessage = (content: string) => {
    if (!content.trim() || !wsRef.current || userId === null || !selectedUser) return;

    const chatMessage: ChatMessage = {
      senderId: userId,
      recipientId: selectedUser.id,
      content: content,
      messageType: 'CHAT',
    };

    setMessages(prevMessages => [...prevMessages, chatMessage]);


    wsRef.current.send(chatMessage);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
            <UserList users={users} selectedUser={selectedUser} onSelectUser={setSelectedUser} currentUser={userId} />
  <ChatWindow messages={messages} selectedUser={selectedUser} currentUser={userId} onSendMessage={handleSendMessage}/>
    </div>
  )
}

export default ChatbotApp;

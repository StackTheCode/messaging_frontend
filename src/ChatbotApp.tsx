
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


    fetch('http://localhost:8080/api/users', {
      headers: { 'Authorization': `Bearer ${storedToken}` }
    })
      .then(response => response.json())
      .then(data => setUsers(data));

    return () => {
      wsClient.disconnect();
    };
  }, [ userId])

  useEffect(() => {
    setIsOtherUserTyping(false)

  }, [selectedUser])

  useEffect(() => {
    selectedUserRef.current = selectedUser;

  }, [selectedUser])

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <UserList users={users}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        currentUser={userId} />

      <ChatWindow messages={messages}
        selectedUser={selectedUser}
        currentUser={userId}
        onSendMessage={handleSendMessage}
        wsRef={wsRef}
        isOtherUserTyping={isOtherUserTyping} />
    </div>
  )
}

export default ChatbotApp;

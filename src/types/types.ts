export interface ChatMessage {
  senderId: number;
  recipientId?: number;
  content: string;
  messageType: 'CHAT' | 'JOIN' | 'LEAVE';
}

export interface UserListProps {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  currentUser: number | null;
}


export type MessagesListProps = {
  messages: ChatMessage[];
  currentUserId: number;
};
export interface User {
  id: number;
  username: string;
}

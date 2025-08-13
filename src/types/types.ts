import type { WsClient } from "../wsClient";

export interface ChatMessage {
  senderId: number;
  recipientId?: number;
  content: string;
  messageType: 'CHAT' | 'JOIN' | 'LEAVE' | "FILE";
  timestamp : string,
  filename?:string,
}


 export interface ChatWindowProps {
  messages: ChatMessage[];
  selectedUser: User | null;
  currentUser: number | null;
  onSendMessage: (content: string) => void;
  wsRef: React.RefObject<WsClient | null>;
  isOtherUserTyping: boolean,
  onClearHistory: (user1Id: number, user2Id: number) => void;
onNewFileMessage :(message :ChatMessage) => void;
}

export interface UserListProps {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  currentUser: number | null;
  searchQuery:string;
  onSearchChange:(query :string) => void,
  handleLogout:() => void;
}


export type MessagesListProps = {
  messages: ChatMessage[];
  currentUserId: number;
};
export interface User {
  id: number;
  username: string;
}

export interface TypingStatusMessage {
  senderId: number;
  recipientId: number;
  typing: boolean;
}

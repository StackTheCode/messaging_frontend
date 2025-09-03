import type { ReactNode, RefObject } from "react";
import type { WsClient } from "../wsClient";

export interface ChatMessage {
  id?: number;
  senderId: number;
  recipientId?: number;
  content: string;
  messageType: 'CHAT' | 'JOIN' | 'LEAVE' | "FILE";
  timestamp : string,
  fileName?:string,
  pending?:boolean
}


 export interface ChatWindowProps {
  messages: ChatMessage[];
  selectedUser: User | null;
  currentUser: number | null;
  onSendMessage: (content: string) => void;
  
  isOtherUserTyping: boolean,
  onClearHistory: (user1Id: number, user2Id: number) => void;
onNewFileMessage :(message :ChatMessage) => void;
 showUserList: boolean;
  setShowUserList: (show: boolean) => void;
  sendTypingStatus:(recipientId: number, typing: boolean) => void;
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
 export interface Task {
  id: number;
  userId: number;
  messageId: number;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  tasksPanelOpen: boolean;

}

export interface TaskContextType extends TaskState {
  createTask: (taskData: CreateTaskData) => Promise<Task>;
  updateTaskStatus: (taskId: number, status: Task['status']) => Promise<void>;
  loadTasks: () => Promise<void>;
  toggleTasksPanel: () => void;
  deleteTask:(taskId:number) =>Promise<void>,
  
}

export interface CreateTaskData {
  messageId: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Task['priority'];
}

export type TaskAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'REMOVE_TASK'; payload: number }
  | { type: 'TOGGLE_TASKS_PANEL' }
  | { type: 'SET_TASKS_PANEL'; payload: boolean };

  export interface TaskProviderProps {
  children: ReactNode;
}
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
export interface MessageContextMenuProps {
  message: ChatMessage;
  position: { x: number; y: number };
  onClose: () => void;
  isVisible: boolean;
}

export interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage;
  modalRef: RefObject<HTMLDivElement | null>; 

}
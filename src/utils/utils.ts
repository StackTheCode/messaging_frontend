import type { ChatMessage, User } from "../types/types";

export const filterMessagesBetweenUsers = (
  messages: ChatMessage[],
  currentUser: number | null,
  selectedUser: User | null
): ChatMessage[] => {
  if (!currentUser || !selectedUser) {
    return [];
  }

  return messages.filter((message: ChatMessage) => {
   
    return (
      (message.senderId === currentUser && message.recipientId === selectedUser.id) ||
      (message.senderId === selectedUser.id && message.recipientId === currentUser)
    );
  });
};
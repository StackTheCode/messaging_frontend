import { apiClient } from "./apiClient";
import type { ChatMessage } from '../types/types';

export const messageService = {
    async getChatHistory(user1Id: number, user2Id: number): Promise<ChatMessage[]> {
        try {
            const response = await apiClient.get<ChatMessage[]>(`/api/messages/history/${user1Id}/${user2Id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching chat history:", error);
            return [];
        }

    },
    async clearChatHistory(user1Id: number, user2Id: number): Promise<boolean> {
        try {
            await apiClient.delete(`/api/messages/history/${user1Id}/${user2Id}`)
            return true;
        } catch (error) {
            console.error('Error clearing chat history:', error);
            return false;
        }
    }

}
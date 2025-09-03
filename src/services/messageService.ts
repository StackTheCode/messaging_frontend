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
    },
     async deleteMessage(messageId: number): Promise<{ success: boolean; error?: string }>{
        try {
            const response = await apiClient.delete(`/api/messages/${messageId}`);
            
            if (response.data.success) {
                console.log('Message deleted successfully:', response.data);
                return { success: true };
            } else {
                return { 
                    success: false, 
                    error: response.data.error || 'Failed to delete message' 
                };
            }
        } catch (error: any) {
            console.error('Error deleting message:', error);
            
            // Handle different types of errors
            if (error.response?.status === 404) {
                return { 
                    success: false, 
                    error: 'Message not found or you don\'t have permission to delete it' 
                };
            } else if (error.response?.status === 401) {
                return { 
                    success: false, 
                    error: 'You are not authorized to delete this message' 
                };
            } else if (error.response?.data?.error) {
                return { 
                    success: false, 
                    error: error.response.data.error 
                };
            } else {
                return { 
                    success: false, 
                    error: 'An unexpected error occurred while deleting the message' 
                };
            }
        }
    },

}
// services/userService.ts
import { apiClient } from '../services/apiClient';
import type { ConversationUser, User } from '../types/types';

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },
  async getUserById(userId: number): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(`/api/users/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error getting current users id:', error);
      return null;

    }
  },

  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/api/users/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },
  async getConversationPartners(userId: number | null): Promise<ConversationUser[]> {
    if (!userId) return [];
    try {
      const response = await apiClient.get<ConversationUser[]>(`/api/users/conversations/${userId}`, {
        params: { userId }
      });
      return response.data;

    } catch (error) {
      console.error("Error fetching messaged usersa: ", error)
      return [];
    }

  }
};
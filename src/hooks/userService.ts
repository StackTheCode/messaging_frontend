// services/userService.ts
import { apiClient } from '../services/apiClient';
import type { User } from '../types/types';

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
  }
};
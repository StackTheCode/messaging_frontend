import type { CreateTaskData, PaginatedResponse, Task } from "../types/types";
import { apiClient } from "./apiClient"

export const taskApi = {
  async createTask(taskData: CreateTaskData): Promise<Task> {
    const response = await apiClient.post<Task>("/api/tasks", taskData);
    return response.data;
  },
  async createTaskFromMessage(messageId: number): Promise<Task> {
    const response = await apiClient.post<Task>(`/api/tasks/from-message/${messageId}`);
    return response.data;
  },
  // Fixed: getTasks returns paginated response, not Task[]
  async getTasks(status: string | null = null, page = 0, size = 50): Promise<PaginatedResponse<Task>> {
    const response = await apiClient.get<PaginatedResponse<Task>>("/api/tasks", {
      params: { status, page, size }
    });
    return response.data;
  },

  // Fixed: taskId should be number to match your context usage
  async updateTaskStatus(taskId: number, status: Task["status"]): Promise<Task> {
    const response = await apiClient.put<Task>(
      `/api/tasks/${taskId}/status`,
      { status }
    );
    return response.data;
  },

  // Fixed: taskId should be number
 async deleteTask(taskId: number): Promise<Task[]> {
  const response = await apiClient.delete<Task[]>(`/api/tasks/${taskId}`);
  return response.data; // Actually return the remaining tasks
},
};
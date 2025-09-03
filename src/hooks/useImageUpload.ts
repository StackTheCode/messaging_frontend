import { useCallback } from 'react';
import { fileService } from '../services/fileService';
import { webSocketService } from '../services/webSocketService';
import type { ChatMessage } from '../types/types';

export const useFileUpload = (
  currentUser: number | null,
  selectedUser: { id: number } | null,
  onNewFileMessage: (message: ChatMessage) => void
) => {
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || !selectedUser || !currentUser) return;

    try {
      const fileUrl = await fileService.uploadFile(file);
      if (!fileUrl) return;

      const fileMessage = fileService.createFileMessage(
        currentUser,
        selectedUser.id,
        fileUrl,
        file.name
      );

      onNewFileMessage(fileMessage);
      webSocketService.sendMessage(fileMessage);
    } catch (error) {
      console.error('File upload error:', error);
    }
  }, [currentUser, selectedUser, onNewFileMessage]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
    // Clear the input
    event.target.value = '';
  }, [handleFileUpload]);

  return {
    handleFileChange,
    handleFileUpload,
  };
};
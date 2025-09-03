import { apiClient } from './apiClient';
import type { ChatMessage } from '../types/types';

export const fileService ={
async uploadFile(file : File) :Promise<string | null>{
    try {
        const formData = new FormData();
        formData.append('file', file)
        const response = await apiClient.post<string>('/api/files/upload', formData,{
            headers: {
          'Content-Type': 'multipart/form-data',
        },
        })
        return response.data ;
    } catch (error) {
        console.error('File upload error:', error);
      return null;
    }
},
createFileMessage(
     currentUser: number,
    recipientId: number,
    fileUrl: string,
    fileName: string
) : ChatMessage {
     return {
      // id: Date.now(),
      senderId: currentUser,
      recipientId,
      content: fileUrl,
      fileName,
      messageType: "FILE",
      timestamp: new Date().toISOString(),
      pending:true
    };
},
isImageFile(fileName : string) : boolean {
        return /\.(jpeg|jpg|gif|png)$/i.test(fileName);

}

}
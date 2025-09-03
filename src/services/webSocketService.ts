// services/websocketService.ts
import { WsClient } from '../wsClient';
import type { ChatMessage, TypingStatusMessage } from '../types/types';
import type { IMessage } from '@stomp/stompjs';

// Change the callback types to use IMessage (what STOMP actually provides)
export type MessageCallback = (message: IMessage) => void;
export type TypingCallback = (message: IMessage) => void;

export class WebSocketService {
  private wsClient: WsClient | null = null;
  private currentUserId: number | null = null;

  connect(
    token: string,
    userId: number,
    onPrivateMessage: MessageCallback,
    onPublicMessage: MessageCallback,
    onTypingStatus: TypingCallback
  ): void {
    this.disconnect();
    
    this.currentUserId = userId;
    this.wsClient = new WsClient(token, userId);

    // Pass the callbacks directly - no JSON parsing here since your app already does it
    this.wsClient.connect(onPrivateMessage, onPublicMessage, onTypingStatus);
  }

  disconnect(): void {
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
  }

  sendMessage(message: ChatMessage): void {
    this.wsClient?.send({
      destination: '/app/chat.send',
      body: JSON.stringify(message),
    });
  }

  sendTypingStatus(recipientId: number, typing: boolean): void {
    if (!this.currentUserId) return;
    
    const payload = {
      senderId: this.currentUserId,
      recipientId,
      typing,
    };

    this.wsClient?.send({
      destination: '/app/chat.typing',
      body: JSON.stringify(payload),
    });
  }
}

export const webSocketService = new WebSocketService();
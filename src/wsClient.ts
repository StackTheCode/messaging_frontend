import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = `${import.meta.env.VITE_API_URL}/ws`;
export class WsClient {
  private token: string;
  private userId: number;
  private client: Client;
  constructor(token: string, userId: number) {
    this.token = token;
    this.userId = userId;



    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),

      connectHeaders: {
        Authorization: `Bearer ${this.token}`,
      },
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        this.client.subscribe(
          `/user/${this.userId}/queue/messages`,
          this.onPrivateMessage
        );
        this.client.subscribe(`/topic/chat`, this.onPublicMessage);

        this.client.subscribe(`/user/${this.userId}/queue/typing`, this.onTypingStatusMessage);
        if (this.onDeleteMessage) {
          this.client.subscribe('/topic/delete', this.onDeleteMessage);
        }
      },
    });
  }
  private onDeleteMessage: (message: IMessage) => void = () => { };
  private onPrivateMessage: (message: IMessage) => void = () => { };
  private onPublicMessage: (message: IMessage) => void = () => { };
  private onTypingStatusMessage: (message: IMessage) => void = () => { }; // NEW: Handler for typing status

  connect(
    onPrivate: (msg: IMessage) => void,
    onPublic: (msg: IMessage) => void,
    onTypingStatus: (msg: IMessage) => void,
   onDelete?: (msg: IMessage) => void 
  ) {
    this.onPrivateMessage = onPrivate;
    this.onPublicMessage = onPublic;
    this.onTypingStatusMessage = onTypingStatus;
     if (onDelete) this.onDeleteMessage = onDelete;
    this.client.activate();
  }

  disconnect() {
    this.client.deactivate();
  }

  send(message: { destination: string; body: string }) {
    this.client.publish({
      destination: message.destination,
      body: message.body
    });
  }
  subscribe(destination: string, callback: (msg: IMessage) => void) {
    this.client.subscribe(destination, callback);
  }
}






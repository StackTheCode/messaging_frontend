import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = "http://localhost:8080/ws";
export class WsClient {
   private token: string;
  private userId: number;
  private client: Client;
 constructor(token: string, userId: number) {
    this.token = token;
    this.userId = userId;




    this.client = new Client({
      webSocketFactory:() => new SockJS(`${WS_URL}?token=${token}`),
      
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
      },
    });
  }

  private onPrivateMessage: (message: IMessage) => void = () => {};
  private onPublicMessage: (message: IMessage) => void = () => {};

  connect(
    onPrivate: (msg: IMessage) => void,
    onPublic: (msg: IMessage) => void
  ) {
    this.onPrivateMessage = onPrivate;
    this.onPublicMessage = onPublic;
    this.client.activate();
  }

  disconnect() {
    this.client.deactivate();
  }

  send(message: any) {
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message)
    });
  }
}






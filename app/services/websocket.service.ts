import { Injectable } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket$: WebSocketSubject<any>;

  constructor() {
    this.socket$ = new WebSocketSubject('ws://localhost:8000/ws');
  }

  // Метод для прослушивания сообщений
  public getMessages() {
    return this.socket$;
  }

  // Метод для отправки сообщений (если требуется)
  public sendMessage(msg: any) {
    this.socket$.next(msg);
  }
}

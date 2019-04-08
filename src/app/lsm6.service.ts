import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Observer } from 'rxjs';
import { Observable } from 'rxjs';

export interface Lsm6Data {
  btn: boolean[];
  sw?: boolean[];
  tmp?: number;
  tic?: number;
  lsm?: {
    dali: number[],
    sp: number[],
    sl: number[][],
    si: number[],
    of: number[],
    oa: number[],
    caof: number[],
    max: number[],
    min: number[],
  };
  dil?: number;
  sens?: {
    ls: number[],
    lt: number[],
    ot: number[],
    ts: number[],
    mo: number[],
    pot: number[]
  };
}

@Injectable()
export class Lsm6Service {


  observer: Subject<string>;
  public messages: Observable<MessageEvent>;

  public url = 'ws://lsm6:8088/echo';
  socket: WebSocket;
  constructor() {
    this.messages = Observable.create((observer: Observer<MessageEvent>) => {
      this.socket.onmessage = observer.next.bind(observer);
      this.socket.onerror = observer.error.bind(observer);
      this.socket.onclose = observer.complete.bind(observer);
      return this.socket.close.bind(this.socket);
    });

    this.observer = Subject.create({
      next: (data: string) => {
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(data);
        }
      }
    });

  }

  public connect(host) {
    this.url = 'ws://' + host + ':8088/echo';
    console.log('LSM6_Chat: ' + this.url);
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
      console.log('LSM6_mes: ' + this.socket.readyState);
    }
    this.socket = new WebSocket(this.url);
  }
  public closeSocket() {
    this.socket.close(1000);
  }
  public send(message: string): void {
    // If the websocket is not connected then the QueueingSubject will ensure
    // that messages are queued and delivered when the websocket reconnects.
    // A regular Subject can be used to discard messages sent when the websocket
    // is disconnected.
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    }

  }
} // end class ChatService
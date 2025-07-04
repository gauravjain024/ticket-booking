import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;
  connect() {
    this.socket = io(environment.apiUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
    });
    
    this.socket.on('disconnect', (reason: string) => {
      console.warn('WebSocket disconnected:', reason);
    });
  }
  joinRoom(eventId: string) {
    console.log(`Joining room for event: ${eventId}`);
    this.socket.emit('joinRoom', eventId);
  }
  onBookingUpdated(): Observable<any> {
    console.log('Listening for booking updates');
    return new Observable((observer) => {
      this.socket.on('bookingUpdated', (data) => observer.next(data));
    });
  }
}

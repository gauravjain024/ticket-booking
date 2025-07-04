import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}
  login(email: string, password: string) {
    return this.http.post(`${this.api}/api/login`, { email, password });
  }
  register(email: string, password: string) {
    return this.http.post(`${this.api}/api/register`, { email, password });
  }

  getEvents() {
    return this.http.get(`${this.api}/api/events`, this.getAuthHeader());
  }
  // Get all slots with event & slot details for current month calendar
  getAllSlots(): Observable<any> {
    return this.http.get(`${this.api}/api/calendar-slots`);
  }

  getSlots(eventId: string): Observable<any> {
    return this.http.get(
      `${this.api}/api/events/${eventId}/slots`,
      this.getAuthHeader()
    );
  }
  bookSlot(eventId: string, slotDate: string) {
    return this.http.post(
      `${this.api}/api/events/${eventId}/book`,
      { slot_date: slotDate },
      this.getAuthHeader()
    );
  }
  // Book multiple seats for a given event slot
  bookSeats(slotId: string, seats: number): Observable<any> {
    return this.http.post(`${this.api}/api/book-seats`, {
      slotId,
      seats,
    });
  }
  private getAuthHeader() {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${localStorage.getItem('token')}`
    );
    return { headers };
  }

  getMyBookings() {
    return this.http.get(`${this.api}/api/my-bookings`);
  }
}

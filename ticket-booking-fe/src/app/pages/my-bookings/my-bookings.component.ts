import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    standalone: false,
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.scss'],
})
export class MyBookingsComponent implements OnInit {
  bookings: any[] = [];

  constructor(private api: ApiService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings() {
    this.api.getMyBookings().subscribe({
      next: (data) => (this.bookings = data as any []),
      error: () => this.toastr.error('Failed to load bookings'),
    });
  }
}

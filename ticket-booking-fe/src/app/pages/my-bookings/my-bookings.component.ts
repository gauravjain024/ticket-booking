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
      next: (data) => (this.bookings = data as any[]),
      error: () => this.toastr.error('Failed to load bookings'),
    });
  }

  cancelBooking(bookingId: string) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.api.cancelBooking(bookingId).subscribe({
        next: () => {
          this.toastr.success('Booking cancelled successfully');
          this.loadBookings(); // Refresh list
        },
        error: (error) => {
          const errorMsg =
            error?.error?.message || 'Failed to cancel booking.';
          this.toastr.error(errorMsg);
        },
      });
    }
  }
}

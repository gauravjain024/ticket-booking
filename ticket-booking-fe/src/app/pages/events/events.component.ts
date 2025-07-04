import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
  selector: 'app-events',
  templateUrl: './events.component.html',
})
export class EventsComponent implements OnInit {
  events: any[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.api.getEvents().subscribe({
      next: (res: any) => (this.events = res),
      error: () => this.toastr.error('Failed to load events'),
    });
  }

  goToCalendar(id: string) {
    this.router.navigate(['/calendar', id]);
  }
}

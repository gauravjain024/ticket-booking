import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from '../../core/services/socket.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  eventId: string = '';
  eventName: string = '';
  weekDays: string[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  calendarData: any = {};
  calendarDataByWeek: any = {};
  seatSelections: { [slotId: string]: number } = {};
  currentWeekIndex = 0;
  weeks: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toastr: ToastrService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['eventId'];

    // Connect to socket and join event room
    this.socketService.connect();
    this.socketService.joinRoom(this.eventId);

    // Load slots
    this.loadCalendarSlots(this.eventId);

    // Listen for booking updates
    this.socketService.onBookingUpdated().subscribe((update) => {
      console.log('Booking update received:', update);
      if (update.eventId === this.eventId) {
        this.loadCalendarSlots(this.eventId);
      }
    });
  }

  nextWeek() {
    if (this.currentWeekIndex < this.weeks.length - 1) {
      this.currentWeekIndex++;
    }
  }

  prevWeek() {
    if (this.currentWeekIndex > 0) {
      this.currentWeekIndex--;
    }
  }

  loadCalendarSlots(eventId: string) {
    this.api.getSlots(eventId).subscribe({
      next: (data) => {
        // this.calendarData = this.groupSlotsByDay(data);
        // this.calendarDataByWeek = this.groupSlotsByWeek(data);
        // console.log('Calendar data loaded:', this.calendarData);
        // console.log('Calendar data by week:', this.calendarDataByWeek);
        this.calendarData = this.groupSlotsByWeek(data);
        this.weeks = Object.keys(this.calendarData).sort();
      },
      error: () => this.toastr.error('Failed to load event slots'),
    });
  }

  groupSlotsByDay(slots: any[]) {
    const grouped: any = {};
    this.weekDays.forEach((day) => (grouped[day] = []));
    if (slots.length > 0) {
      this.eventName = slots[0].name;
    }

    slots.forEach((slot) => {
      const date = new Date(slot.date);
      const weekDay = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (grouped[weekDay]) {
        grouped[weekDay].push(slot);
      }
    });

    return grouped;
  }

  groupSlotsByWeek(slots: any[]) {
    const groupedByWeek: any = {};

    if (slots.length > 0) {
      this.eventName = slots[0].name;
    }

    slots.forEach((slot) => {
      const date = new Date(slot.date);

      // Find week start date (Monday)
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(date.getDate() + diffToMonday);

      const weekKey = weekStart.toISOString().split('T')[0];

      // If week group doesn't exist, initialize with week days
      if (!groupedByWeek[weekKey]) {
        groupedByWeek[weekKey] = {};
        this.weekDays.forEach((day) => (groupedByWeek[weekKey][day] = []));
      }

      const weekDay = date.toLocaleDateString('en-US', { weekday: 'long' });
      groupedByWeek[weekKey][weekDay].push(slot);
    });

    return groupedByWeek;
  }

  incrementSeats(slotId: string) {
    this.seatSelections[slotId] = (this.seatSelections[slotId] || 0) + 1;
  }

  decrementSeats(slotId: string) {
    if (this.seatSelections[slotId] > 0) {
      this.seatSelections[slotId]--;
    }
  }

  bookSeats(slot: any) {
    const seatsToBook = this.seatSelections[slot.slot_id];
    if (!seatsToBook || seatsToBook <= 0) {
      this.toastr.warning('Select number of seats to book');
      return;
    }

    if (seatsToBook > slot.available_slots) {
      this.toastr.error('Not enough available seats');
      return;
    }

    this.api.bookSeats(slot.slot_id, seatsToBook).subscribe({
      next: () => {
        this.toastr.success(`${seatsToBook} seat(s) booked for event.`);
        this.seatSelections[slot.slot_id] = 0;
        this.loadCalendarSlots(this.eventId);
      },
      error: (error) => {
        const errorMsg =
          error?.error?.message || 'Booking failed due to an unexpected error.';
        this.toastr.error(errorMsg);
      },
    });
  }
  getDateForDay(weekStartDate: string, dayName: string): Date {
    const startDate = new Date(weekStartDate);
    const dayIndexMap: { [key: string]: number } = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
    };

    const dayOffset = dayIndexMap[dayName];
    const resultDate = new Date(startDate);
    resultDate.setDate(startDate.getDate() + dayOffset + 1);

    return resultDate;
  }

  isSlotDisabled(slot: any): boolean {
    const now = new Date();
    const slotDate = new Date(slot.date);

    // If the date is before today
    if (slotDate < new Date(now.toDateString())) return true;

    // If it's today, compare time
    if (slotDate.toDateString() === now.toDateString()) {
      const [slotHours, slotMinutes] = slot.start_time.split(':').map(Number);
      if (
        slotHours < now.getHours() ||
        (slotHours === now.getHours() && slotMinutes <= now.getMinutes())
      ) {
        return true;
      }
    }

    return false;
  }
}

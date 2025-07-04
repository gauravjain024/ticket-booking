export interface User {
  id: string;
  email: string;
  password_hash: string;
}

export interface EventSlot {
  id: string;
  event_id: string;
  date: string;
  available_slots: number;
}

import { Request, Response } from "express";
import pool from "../services/db";
import { v4 as uuidv4 } from "uuid";
import { io } from "../server";

export const getEvents = async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT DISTINCT events.*
FROM events
JOIN event_slots ON events.id = event_slots.event_id
WHERE event_slots.date >= CURRENT_DATE`
  );
  res.json(result.rows);
};

export const getEventSlots = async (req: Request, res: Response) => {
  const eventId = req.params.id;
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const start = startOfMonth.toISOString().slice(0, 10);
  const endOfMonth = new Date(
    startOfMonth.getFullYear(),
    startOfMonth.getMonth() + 1,
    0
  );
  const end = endOfMonth.toISOString().slice(0, 10);

  const result = await pool.query(
    `SELECT 
       es.id as slot_id, es.date, es.start_time, es.end_time, es.available_slots,  es.total_slots, 
       e.id as event_id, e.name, e.category
     FROM event_slots es
     JOIN events e ON es.event_id = e.id
     WHERE es.event_id = $1
     AND es.date BETWEEN $2 AND $3
     ORDER BY es.date, es.start_time`,
    [eventId, start, end]
  );

  res.json(result.rows);
};


export const bookSeats = async (req: Request, res: Response) => {
  const { slotId, seats } = req.body;
  const userId = (req as any).user.userId;

  // Fetch slot details
  const slotResult = await pool.query(`SELECT * FROM event_slots WHERE id=$1`, [
    slotId,
  ]);

  const slot = slotResult.rows[0];
  if (!slot) return res.status(404).json({ message: "Show slot not found" });

  const datePart = new Date(slot.date); // safely extract date
  const slotDateTimeString = new Date(datePart.setHours(slot.start_time.split(":")[0], slot.start_time.split(":")[1], 0, 0)).toISOString();
  const slotDateTime = new Date(slotDateTimeString);
  const now = new Date();

  if (isNaN(slotDateTime.getTime())) {
    return res
      .status(500)
      .json({ message: "Invalid slot date or time format" });
  }

  // Check if showtime is in the past
  if (slotDateTime.getTime() < now.getTime()) {
    return res.status(400).json({ message: "Cannot book for past Events." });
  }

  if (slot.available_slots < seats)
    return res.status(400).json({ message: "Not enough seats available." });

  // Deduct seats
  await pool.query(
    `UPDATE event_slots SET available_slots = available_slots - $1 WHERE id = $2`,
    [seats, slotId]
  );

  // Add booking record
  await pool.query(
    `INSERT INTO bookings(id, user_id, event_id, slot_id, seats)
     VALUES($1, $2, $3, $4, $5)`,
    [uuidv4(), userId, slot.event_id, slotId, seats]
  );

  // Emit real-time update to connected clients for this slot’s movie
  io.to(slot.event_id).emit("bookingUpdated", {
    eventId: slot.event_id,
    slotId: slotId,
    availableSeats: slot.available_slots - seats,
  });

  res.json({ message: `${seats} seat(s) booked successfully` });
};


export const getAllEventSlots = async (req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT es.id, e.name AS event_name, es.event_id, es.date, es.start_time, es.end_time, es.available_slots, es.total_slots
    FROM event_slots es
    JOIN events e ON es.event_id = e.id
    ORDER BY es.date, es.start_time;
  `);
  res.json(result.rows);
};

export const getCalendarSlots = async (req: Request, res: Response) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const start = startOfMonth.toISOString().slice(0, 10);
  const endOfMonth = new Date(
    startOfMonth.getFullYear(),
    startOfMonth.getMonth() + 1,
    0
  );
  const end = endOfMonth.toISOString().slice(0, 10);

  const result = await pool.query(
    `SELECT 
       es.id as slot_id, es.date, es.start_time, es.end_time, es.available_slots,  es.total_slots, 
       e.id as event_id, e.name, e.category
     FROM event_slots es
     JOIN events e ON es.event_id = e.id
     WHERE es.date BETWEEN $1 AND $2
     ORDER BY es.date, es.start_time`,
    [start, end]
  );

  res.json(result.rows);
};

export const getUserBookings = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const result = await pool.query(
    `SELECT 
      b.id AS booking_id,
      e.name AS event_name,
      es.date,
      es.start_time,
      b.seats,
      b.booked_at
    FROM bookings b
    JOIN events e ON b.event_id = e.id
    JOIN event_slots es ON b.slot_id = es.id
    WHERE b.user_id = $1
    ORDER BY es.date, es.start_time`,
    [userId]
  );

  res.json(result.rows);
};


export const cancelBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const userId = (req as any).user.userId;

  // Check booking belongs to this user
  const bookingResult = await pool.query(
    `SELECT b.*, s.date, s.start_time 
     FROM bookings b 
     JOIN event_slots s ON b.slot_id = s.id 
     WHERE b.id = $1 AND b.user_id = $2`,
    [bookingId, userId]
  );

  const booking = bookingResult.rows[0];
  if (!booking)
    return res
      .status(404)
      .json({ message: "Booking not found or unauthorized" });
  
  const now = new Date();
  const datePart = new Date(booking.date); // safely extract date
  const slotDateTimeString = new Date(
    datePart.setHours(
      booking.start_time.split(":")[0],
      booking.start_time.split(":")[1],
      0,
      0
    )
  ).toISOString();
  const slotDateTime = new Date(slotDateTimeString);
  

  if (slotDateTime < now) {
    return res.status(400).json({ message: "Cannot cancel past bookings" });
  }

  // Free up the seats in the slot
  await pool.query(
    `UPDATE event_slots SET available_slots = available_slots + $1 WHERE id = $2`,
    [booking.seats, booking.slot_id]
  );

  // Delete booking record
  await pool.query(`DELETE FROM bookings WHERE id=$1`, [bookingId]);

  // Emit update to slot's event room
  io.to(booking.event_id).emit("bookingUpdated", {
    eventId: booking.event_id,
    slotId: booking.slot_id,
    message: "Booking cancelled",
  });

  res.json({ message: "Booking cancelled successfully" });
};
import express from "express";
import {
  getEvents,
  getEventSlots,
  getCalendarSlots,
  bookSeats,
  getUserBookings,
} from "../controllers/eventController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/events", authenticateToken, getEvents);
router.get("/events/:id/slots", authenticateToken, getEventSlots);
router.get("/calendar-slots", authenticateToken, getCalendarSlots);
router.get("/calendar-slots2",  getCalendarSlots);
router.post("/book-seats", authenticateToken, asyncHandler(bookSeats));
router.get("/my-bookings", authenticateToken, getUserBookings);

export default router;

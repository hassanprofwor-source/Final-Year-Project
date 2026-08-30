import express from "express";
import { saveBooking, getBookings, getMyBookings, updateBooking, getAvailability, cancelMyBooking } from "../controllers/bookingController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
router.get("/getBookings", requireAdmin, getBookings);
router.get("/availability", getAvailability);
router.get("/myBookings/:email", getMyBookings);
router.post("/saveBooking", saveBooking);
router.post("/cancelMyBooking", cancelMyBooking);
router.put("/updateBooking/:id", requireAdmin, updateBooking);
export default router;

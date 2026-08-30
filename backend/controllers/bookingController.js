import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Booking } from "../models/bookingSchema.js";
import { TimeSlot } from "../models/timeSlotSchema.js";
import { ensureDefaultTimeSlots, normalizeTime } from "./timeSlotController.js";
import { sendPushToEmail } from "../utils/push.js";

const isTakenStatus = (status) => status !== "Cancelled";

export const saveBooking = catchAsyncErrors(async (req, res, next) => {
  const { time, date, tableNumber, people, email, status } = req.body;

  if (!time || !date || !tableNumber || !people) {
    return next(new ErrorHandler("Please fill all required fields.", 400));
  }

  await ensureDefaultTimeSlots();
  const slotTime = normalizeTime(time);
  const availableSlot = await TimeSlot.findOne({ time: slotTime || time, enabled: true });
  if (!availableSlot) {
    return next(new ErrorHandler("This time slot is not available.", 400));
  }

  const conflict = await Booking.findOne({
    tableNumber: Number(tableNumber),
    date,
    time: availableSlot.time,
    status: { $ne: "Cancelled" },
  });

  if (conflict) {
    return next(new ErrorHandler("This table is already booked for that date and time.", 409));
  }

  const booking = await Booking.create({
    time: availableSlot.time,
    date,
    tableNumber: Number(tableNumber),
    people: Number(people),
    email: email || "",
    status: status || (email ? "Pending" : "Confirmed"),
  });

  res.status(201).json({
    success: true,
    message: "Booked successfully.",
    data: booking,
  });
});

export const getBookings = catchAsyncErrors(async (req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: bookings,
  });
});

export const getAvailability = catchAsyncErrors(async (req, res, next) => {
  const { date, time } = req.query;
  if (!date || !time) {
    return next(new ErrorHandler("Date and time are required.", 400));
  }

  const booked = await Booking.find({
    date,
    time,
    status: { $ne: "Cancelled" },
  }).select("tableNumber -_id");

  res.status(200).json({
    success: true,
    data: booked.map((item) => item.tableNumber),
  });
});

export const getMyBookings = catchAsyncErrors(async (req, res, next) => {
  const email = decodeURIComponent(req.params.email || "");
  if (!email) {
    return next(new ErrorHandler("Email is required.", 400));
  }

  const bookings = await Booking.find({ email }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: bookings,
  });
});

export const updateBooking = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Confirmed", "Cancelled"].includes(status)) {
    return next(new ErrorHandler("Invalid booking status.", 400));
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return next(new ErrorHandler("Booking not found.", 404));
  }

  if (status === "Confirmed" && isTakenStatus(booking.status) === false) {
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      tableNumber: booking.tableNumber,
      date: booking.date,
      time: booking.time,
      status: { $ne: "Cancelled" },
    });
    if (conflict) {
      return next(new ErrorHandler("This table is already booked for that date and time.", 409));
    }
  }

  booking.status = status;
  await booking.save();

  if (status === "Confirmed") {
    await sendPushToEmail(booking.email, {
      title: "Table confirmed",
      body: `Table ${booking.tableNumber} is booked for ${booking.date} at ${booking.time}.`,
      screen: "home",
    });
  } else if (status === "Cancelled") {
    await sendPushToEmail(booking.email, {
      title: "Reservation cancelled",
      body: "Your Skyplate table booking was cancelled.",
      screen: "home",
    });
  }

  res.status(200).json({
    success: true,
    message: "Booking updated successfully.",
    data: booking,
  });
});

export const cancelMyBooking = catchAsyncErrors(async (req, res, next) => {
  const { id, email } = req.body;
  if (!id || !email) {
    return next(new ErrorHandler("Booking id and email are required.", 400));
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return next(new ErrorHandler("Booking not found.", 404));
  }
  if (booking.email !== email) {
    return next(new ErrorHandler("You can only cancel your own booking.", 403));
  }
  if (booking.status === "Cancelled") {
    return next(new ErrorHandler("This booking is already cancelled.", 400));
  }

  booking.status = "Cancelled";
  await booking.save();

  res.status(200).json({
    success: true,
    message: "Reservation cancelled.",
    data: booking,
  });
});

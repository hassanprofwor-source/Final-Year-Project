import { getAuth } from "@clerk/express";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Booking } from "../models/bookingSchema.js";
import { Order } from "../models/orderSchema.js";
import { TimeSlot } from "../models/timeSlotSchema.js";
import { ensureDefaultTimeSlots, normalizeTime } from "./timeSlotController.js";
import { sendPushToEmail } from "../utils/push.js";
import { notifyAdmin } from "../utils/notifyAdmin.js";
import { stripe } from "../server.js";
import { CURRENCY_CODE } from "../utils/currency.js";

const RESERVATION_FEE_PENCE = 1000;
const RESERVATION_CURRENCY = CURRENCY_CODE;

const isTakenStatus = (status) => status !== "Cancelled";
const isAdminRequest = (req) => {
  try {
    return getAuth(req).sessionClaims?.metadata?.role === "admin";
  } catch {
    return false;
  }
};

export const createReservationPayment = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Email is required to pay the reservation fee.", 400));
  }

  let customer;
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await stripe.customers.create({ email });
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2025-03-31.basil" }
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: RESERVATION_FEE_PENCE,
    currency: RESERVATION_CURRENCY,
    customer: customer.id,
    metadata: { purpose: "reservation_fee" },
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

const verifyReservationPayment = async (stripePaymentIntentId) => {
  if (!stripePaymentIntentId) {
    throw new ErrorHandler("Please pay the £10 reservation fee first.", 400);
  }

  const alreadyUsed = await Booking.findOne({ stripePaymentIntentId });
  if (alreadyUsed) {
    throw new ErrorHandler("This payment has already been used for a reservation.", 409);
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
  if (
    paymentIntent.status !== "succeeded" ||
    paymentIntent.amount !== RESERVATION_FEE_PENCE ||
    paymentIntent.currency !== RESERVATION_CURRENCY
  ) {
    throw new ErrorHandler("Reservation payment could not be verified.", 402);
  }

  return paymentIntent;
};

export const saveBooking = catchAsyncErrors(async (req, res, next) => {
  const { time, date, tableNumber, people, email, status, stripePaymentIntentId } = req.body;

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

  const customerEmail = email || "";
  const adminBooking = isAdminRequest(req);
  let paymentStatus = "waived";

  if (!adminBooking && customerEmail) {
    try {
      await verifyReservationPayment(stripePaymentIntentId);
    } catch (error) {
      return next(error);
    }
    paymentStatus = "paid";
  }

  const booking = await Booking.create({
    time: availableSlot.time,
    date,
    tableNumber: Number(tableNumber),
    people: Number(people),
    email: customerEmail,
    status: status || (customerEmail ? "Pending" : "Confirmed"),
    reservationFee: 10,
    currency: RESERVATION_CURRENCY,
    paymentStatus,
    stripePaymentIntentId: paymentStatus === "paid" ? stripePaymentIntentId : "",
  });

  if (!adminBooking && customerEmail) {
    await notifyAdmin({
      type: "booking",
      title: "New table booking",
      body: `${customerEmail} requested Table ${booking.tableNumber} on ${booking.date} at ${booking.time}.`,
      link: "/Manage/Tables",
      refId: booking._id,
    });
  }

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

  const seated = await Order.find({
    orderType: "Dine In",
    date,
    time,
    status: { $in: ["Pending", "Accepted"] },
  }).select("tableNumber -_id");

  const taken = [...new Set([
    ...booked.map((item) => item.tableNumber),
    ...seated.map((item) => item.tableNumber),
  ])];

  res.status(200).json({
    success: true,
    data: taken,
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

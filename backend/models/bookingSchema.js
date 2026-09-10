import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    people: { type: Number, required: true },
    email: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
    reservationFee: { type: Number, default: 10 },
    currency: { type: String, default: "gbp" },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "waived"],
      default: "unpaid",
    },
    stripePaymentIntentId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("bookings", bookingSchema);

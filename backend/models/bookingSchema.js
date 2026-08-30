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
  },
  { timestamps: true }
);

export const Booking = mongoose.model("bookings", bookingSchema);

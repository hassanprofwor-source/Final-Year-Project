import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    time: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const TimeSlot = mongoose.model("timeslots", timeSlotSchema);

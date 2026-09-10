import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["booking", "dine_in", "delivery"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String, required: true },
    read: { type: Boolean, default: false },
    refId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("notifications", notificationSchema);

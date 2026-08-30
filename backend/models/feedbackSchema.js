import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true },
  feedback: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  response: { type: String },
  image: { type: String },
  completed: { type: Boolean, default: false },
});

export const Feedback = mongoose.model("feedback", feedbackSchema);

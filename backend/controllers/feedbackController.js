import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import {Feedback} from '../models/feedbackSchema.js'
import nodemailer from 'nodemailer'
import mongoose from "mongoose";

export const savefeedback = catchAsyncErrors(async (req, res, next) => {
    const { firstname, email, phone, feedback, image, rating } = req.body;
  
    if (!firstname || !feedback || !email || !phone || !rating) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return next(new ErrorHandler("Rating must be between 1 and 5.", 400));
    }
  
    const feedbackRecieved = await Feedback.create({
      firstname,
      email,
      phone,
      feedback,
      image,
      rating: numericRating,
    });
  
    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedbackRecieved,
    });
  });

export const getfeedbacks = catchAsyncErrors(async (req, res) => {
  const feedbacks = await Feedback.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: feedbacks,
  });
});

export const getMyFeedback = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.params;
  if (!email) {
    return next(new ErrorHandler("Email is required.", 400));
  }

  const feedbacks = await Feedback.find({ email }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: feedbacks,
  });
});


export const sendEmail = catchAsyncErrors(async (req, res, next) => {
  const { email, subject, message } = req.body;
  if (!email || !subject || !message) {
    return next(new ErrorHandler("Email, subject, and message are required.", 400));
  }

  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  try {
      const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: smtpPort,
          secure: smtpPort === 465,
          service: process.env.SMTP_SERVICE,
          auth: {
              user: process.env.SMTP_MAIL,
              pass: (process.env.SMTP_PASSWORD || "").replace(/\s/g, ""),
          },
      });

      await transporter.sendMail({
          from: `"Skyplate" <${process.env.SMTP_MAIL}>`,
          to: email,
          subject: subject,
          text: message,
      });

      res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
      console.error(error);
      const message =
        error.code === "EAUTH"
          ? "Gmail rejected the SMTP login. Set SMTP_PASSWORD to a 16-character App Password (2-Step Verification must be on)."
          : "Failed to send email";
      res.status(500).json({ success: false, message });
  }
});


export const updatefeedback = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params; // Get ID from URL
    const { response } = req.body; // Get response from request body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid feedback ID" });
    }

    // Find the feedback by _id and update
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id, 
      { response, completed: true }, 
      { new: true }
    );

    if (!updatedFeedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({ message: "Feedback updated successfully", data: updatedFeedback });
  } catch (error) {
    res.status(500).json({ message: "Error updating feedback", error: error.message });
  }
});
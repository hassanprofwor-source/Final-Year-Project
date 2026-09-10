import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Notification } from "../models/notificationSchema.js";

export const getNotifications = catchAsyncErrors(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ read: false });
  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
  });
});

export const markNotificationRead = catchAsyncErrors(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true }
  );
  if (!notification) {
    return next(new ErrorHandler("Notification not found.", 404));
  }
  res.status(200).json({
    success: true,
    data: notification,
  });
});

export const markAllNotificationsRead = catchAsyncErrors(async (req, res) => {
  await Notification.updateMany({ read: false }, { read: true });
  res.status(200).json({
    success: true,
    message: "All notifications marked as read.",
  });
});

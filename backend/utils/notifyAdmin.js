import { Notification } from "../models/notificationSchema.js";

export const notifyAdmin = async ({ type, title, body, link, refId }) => {
  try {
    await Notification.create({
      type,
      title,
      body,
      link,
      refId: refId ? String(refId) : "",
      read: false,
    });
  } catch (error) {
    console.error("Failed to create admin notification", error);
  }
};

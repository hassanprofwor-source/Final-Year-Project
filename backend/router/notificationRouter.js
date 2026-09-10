import express from "express";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notificationController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
router.get("/", requireAdmin, getNotifications);
router.put("/read-all", requireAdmin, markAllNotificationsRead);
router.put("/:id/read", requireAdmin, markNotificationRead);
export default router;

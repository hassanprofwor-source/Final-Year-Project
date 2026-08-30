import express from "express";
import { getPeakHours } from "../controllers/analyticsController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
router.get("/peak-hours", requireAdmin, getPeakHours);
export default router;

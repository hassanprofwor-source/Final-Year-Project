import express from "express";
import {
  getItemDemand,
  getMenuInsights,
  getModelMetrics,
  getPeakHours,
  retrainPeakHours,
} from "../controllers/analyticsController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
router.get("/peak-hours", requireAdmin, getPeakHours);
router.get("/menu-insights", requireAdmin, getMenuInsights);
router.get("/item-demand", requireAdmin, getItemDemand);
router.get("/model-metrics", requireAdmin, getModelMetrics);
router.post("/retrain", requireAdmin, retrainPeakHours);
export default router;

import express from "express";
import {
  getTimeSlots,
  getAllTimeSlots,
  saveTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
} from "../controllers/timeSlotController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
router.get("/getTimeSlots", getTimeSlots);
router.get("/getAllTimeSlots", requireAdmin, getAllTimeSlots);
router.post("/saveTimeSlot", requireAdmin, saveTimeSlot);
router.put("/updateTimeSlot/:id", requireAdmin, updateTimeSlot);
router.delete("/deleteTimeSlot/:id", requireAdmin, deleteTimeSlot);
export default router;

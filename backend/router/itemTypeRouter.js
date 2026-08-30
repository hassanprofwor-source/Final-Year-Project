import express from "express";
import { saveItemType, getItemTypes, updateItemType, deleteItemType } from "../controllers/itemTypeController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
router.post("/addType", requireAdmin, saveItemType);
router.get("/getTypes", getItemTypes);
router.put("/updateType/:id", requireAdmin, updateItemType);
router.delete("/deleteType/:id", requireAdmin, deleteItemType);

export default router;

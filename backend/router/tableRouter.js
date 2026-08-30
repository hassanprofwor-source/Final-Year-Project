import express from "express";
import { saveTable, getTables, updateTable,deleteTable } from "../controllers/tableController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
router.post("/saveTable", requireAdmin, saveTable);
router.get("/getTables", getTables);
router.put("/updateTable/:id", requireAdmin, updateTable);
router.delete("/deleteTable/:id", requireAdmin, deleteTable);

export default router;

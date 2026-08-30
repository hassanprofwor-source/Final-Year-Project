import express from "express";
import { deleteItem, saveItem, updateItem,getItems } from "../controllers/menuController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

router.post("/addFood", requireAdmin, saveItem);
router.get("/getFood", getItems);
router.put("/updateFood/:id", requireAdmin, updateItem);
router.delete("/deleteFood/:id", requireAdmin, deleteItem);
export default router;

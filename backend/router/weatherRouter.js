import express from "express";
import { getWeatherSuggestions } from "../controllers/weatherController.js";

const router = express.Router();
router.get("/", getWeatherSuggestions);
export default router;

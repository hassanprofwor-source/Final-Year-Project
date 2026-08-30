import express from "express";
import { savefeedback, getfeedbacks, getMyFeedback, sendEmail, updatefeedback } from "../controllers/feedbackController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

router.post("/savefeedback", savefeedback);
router.get("/getfeedbacks", requireAdmin, getfeedbacks);
router.get("/myfeedback/:email", getMyFeedback);
router.post("/sendemail", requireAdmin, sendEmail)
router.put("/updatefeedback/:id", requireAdmin, updatefeedback)

export default router;

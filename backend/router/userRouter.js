import express from "express";
import { saveUser, updateUser, getUser, getUsers, savePushToken } from "../controllers/userController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
const router = express.Router();

router.post("/saveuser", saveUser);
router.post("/updateuser/:email", updateUser);
router.get("/getuser/:email", getUser);
router.get("/getusers", requireAdmin, getUsers);
router.post("/pushtoken", savePushToken);

export default router;

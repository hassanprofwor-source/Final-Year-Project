import express from "express";
import { saveOrder,getOrders,getOrder,getOrderDelivery,updateOrder,deleteOrder,getCompletedOrders, stripePayment, getOrderDine, stripePaymentDelivery, cancelPendingOrder } from "../controllers/orderController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
router.get("/getOrders", requireAdmin, getOrders);
router.get("/getCompleted/:email", getCompletedOrders);
router.get("/getOrderDelivery/:email", getOrderDelivery);
router.get("/getOrderDine/:email", getOrderDine);
router.get("/getOrder/:email", getOrder);
router.post("/saveOrder", saveOrder);
router.post("/cancelPending", cancelPendingOrder);
router.post("/create-order-payment", stripePayment);
router.post("/create-order-payment-delivery", stripePaymentDelivery);

router.put("/updateOrder/:id", requireAdmin, updateOrder);
router.delete("/deleteOrder/:id", requireAdmin, deleteOrder);
export default router;

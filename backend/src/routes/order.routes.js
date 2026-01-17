import express from "express";
import { createOrder, getOrder } from "../controllers/order.controller.js";

const router = express.Router();

router.post("/api/v1/orders", createOrder);
router.get("/api/v1/orders/:orderId", getOrder);

export default router;

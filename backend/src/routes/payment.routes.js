import express from "express";
import {
  createPayment,
  getPayment,
  capturePayment,
} from "../controllers/payment.controller.js";
import { createRefund } from "../controllers/refund.controller.js";

const router = express.Router();

router.post("/api/v1/payments", createPayment);
router.get("/api/v1/payments/:paymentId", getPayment);
router.post("/api/v1/payments/:paymentId/capture", capturePayment);
router.post("/api/v1/payments/:paymentId/refunds", createRefund); // Prompt: POST /api/v1/payments/{payment_id}/refunds

export default router;

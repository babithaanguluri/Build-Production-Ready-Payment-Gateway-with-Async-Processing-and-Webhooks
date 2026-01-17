import express from "express";
import {
  getCheckoutOrder,
  createCheckoutPayment,
} from "../controllers/checkout.controller.js";

const router = express.Router();

router.get("/checkout/orders/:orderId", getCheckoutOrder);
router.post("/checkout/payments", createCheckoutPayment);

export default router;

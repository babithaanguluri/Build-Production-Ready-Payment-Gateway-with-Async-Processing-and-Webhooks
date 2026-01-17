import express from "express";
import { getRefund } from "../controllers/refund.controller.js";

const router = express.Router();

router.get("/api/v1/refunds/:refundId", getRefund);

export default router;

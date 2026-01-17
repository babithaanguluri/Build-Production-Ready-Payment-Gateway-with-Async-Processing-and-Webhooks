import express from "express";
import {
  getDashboardStats,
  getDashboardTransactions,
  getMerchantConfig,
  updateMerchantConfig,
  regenerateSecret,
} from "../controllers/dashboard.controller.js";
import { authenticateMerchant } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/api/v1/dashboard/stats", authenticateMerchant, getDashboardStats);
router.get(
  "/api/v1/dashboard/transactions",
  authenticateMerchant,
  getDashboardTransactions
);

router.get("/api/v1/dashboard/config", authenticateMerchant, getMerchantConfig);
router.post("/api/v1/dashboard/config", authenticateMerchant, updateMerchantConfig);
router.post("/api/v1/dashboard/regenerate-secret", authenticateMerchant, regenerateSecret);

export default router;

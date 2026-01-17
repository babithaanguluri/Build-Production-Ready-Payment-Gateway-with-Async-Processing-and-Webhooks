import express from "express";
import { listWebhooks, retryWebhook, sendTestWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();

router.get("/api/v1/webhooks", listWebhooks);
router.post("/api/v1/webhooks/:webhookId/retry", retryWebhook);
router.post("/api/v1/webhooks/test", sendTestWebhook);

export default router;

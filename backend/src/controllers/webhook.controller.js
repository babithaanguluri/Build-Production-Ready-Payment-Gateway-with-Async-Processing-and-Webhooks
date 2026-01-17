import { pool } from "../db/pool.js";
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queues/index.js";

const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, {
    connection: {
        url: process.env.REDIS_URL,
    },
});

export const listWebhooks = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const countRes = await pool.query(
        "SELECT COUNT(*) FROM webhook_logs WHERE merchant_id = $1",
        [req.merchant.id]
    );
    const total = parseInt(countRes.rows[0].count);

    const logsRes = await pool.query(
        "SELECT * FROM webhook_logs WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [req.merchant.id, limit, offset]
    );

    const data = logsRes.rows.map(log => ({
        id: log.id,
        event: log.event,
        status: log.status,
        attempts: log.attempts,
        created_at: new Date(log.created_at).toISOString(),
        last_attempt_at: log.last_attempt_at ? new Date(log.last_attempt_at).toISOString() : null,
        response_code: log.response_code
    }));

    return res.json({
        data,
        total,
        limit,
        offset
    });
};

export const retryWebhook = async (req, res) => {
    const { webhookId } = req.params;

    const logRes = await pool.query(
        "SELECT * FROM webhook_logs WHERE id = $1 AND merchant_id = $2",
        [webhookId, req.merchant.id]
    );

    if (logRes.rows.length === 0) {
        return res.status(404).json({ error: { code: "NOT_FOUND_ERROR", description: "Webhook log not found" } });
    }

    const log = logRes.rows[0];

    // Reset attempts and status
    // Prompt: "Reset attempts to 0, set status to 'pending', enqueue DeliverWebhookJob"
    await pool.query(
        "UPDATE webhook_logs SET attempts = 0, status = 'pending', next_retry_at = NULL WHERE id = $1",
        [webhookId]
    );

    await webhookQueue.add("deliver-webhook", {
        merchantId: log.merchant_id,
        event: log.event,
        payload: log.payload,
        webhookLogId: webhookId
    });

    return res.json({
        id: webhookId,
        status: "pending",
        message: "Webhook retry scheduled"
    });
};

export const sendTestWebhook = async (req, res) => {
    const payload = {
        event: "test.event",
        timestamp: Math.floor(Date.now() / 1000),
        data: {
            message: "This is a test webhook from the dashboard",
            triggered_at: new Date().toISOString()
        }
    };

    await webhookQueue.add("deliver-webhook", {
        merchantId: req.merchant.id,
        event: "test.event",
        payload: payload
    });

    return res.json({ success: true, message: "Test webhook scheduled" });
};

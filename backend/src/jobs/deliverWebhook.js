import { pool } from "../db/pool.js";
import { QUEUE_NAMES } from "../queues/index.js";
import { Queue } from "bullmq";
import crypto from "crypto";
import https from "https";
import http from "http";
import { URL } from "url";

const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, {
    connection: {
        url: process.env.REDIS_URL,
    },
});

const calculateNextRetry = (attempt, isTest) => {
    // attempt is 1-based index (current failure) matches the prompt's "Attempt X" logic?
    // "Attempt 1: Immediate" -> This was the first run.
    // "Attempt 2: After 1 minute" -> If attempt 1 fails, next is attempt 2.

    // Defined intervals after failure of Attempt N:
    // Fail 1 -> wait for 2.
    // Fail 2 -> wait for 3.

    // Prompt:
    // Attempt 1: Immediate
    // Attempt 2: After 1 min (from attempt 1?) Yes.
    // Attempt 3: After 5 min
    // Attempt 4: After 30 min
    // Attempt 5: After 2 hours

    // Test Mode intervals: 0, 5, 10, 15, 20

    // If we just failed attempt 1. Delta to attempt 2.
    // If we just failed attempt 2. Delta to attempt 3.

    // Map successful failure count (which is attempts so far) to delay for NEXT attempt.
    // If `attempts` in DB is 1 (just failed), we need delay for attempt 2.

    const rules = isTest
        ? [0, 5, 10, 15, 20] // Test delays (seconds)
        : [0, 60, 300, 1800, 7200]; // Prod delays (seconds)

    // If attempts = 1, we want index 1 (2nd item) ?
    // Attempt 1 (index 0) was immediate.
    // Delay for Attempt 2 is rules[1].

    if (attempt >= rules.length) return null; // No more retries

    return rules[attempt] * 1000;
};

export const deliverWebhook = async (job) => {
    const { merchantId, event, payload, webhookLogId } = job.data;
    console.log(`Delivering webhook for merchant ${merchantId}, event: ${event}`);

    let logId = webhookLogId;
    let currentAttempts = 0;

    try {
        // 1. Fetch Merchant
        const merchantRes = await pool.query(
            "SELECT * FROM merchants WHERE id = $1",
            [merchantId]
        );
        if (merchantRes.rows.length === 0) {
            throw new Error(`Merchant ${merchantId} not found`);
        }
        const merchant = merchantRes.rows[0];

        if (!merchant.webhook_url) {
            console.log("No webhook URL configured, skipping.");
            return;
        }

        // 2. Get/Create Log Entry
        if (!logId) {
            const insertRes = await pool.query(
                "INSERT INTO webhook_logs (merchant_id, event, payload, status, attempts) VALUES ($1, $2, $3, 'pending', 0) RETURNING id",
                [merchantId, event, payload]
            );
            logId = insertRes.rows[0].id;
        } else {
            const logRes = await pool.query("SELECT attempts FROM webhook_logs WHERE id = $1", [logId]);
            if (logRes.rows.length > 0) {
                currentAttempts = logRes.rows[0].attempts;
            }
        }

        // 3. Prepare Request
        const signature = crypto
            .createHmac("sha256", merchant.webhook_secret || "")
            .update(JSON.stringify(payload))
            .digest("hex");

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        let responseCode = null;
        let responseBody = null;
        let success = false;

        // Increment attempts now or after? Prompt says "Record attempt number (increment)".
        currentAttempts += 1;

        try {
            const response = await fetch(merchant.webhook_url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-Signature": signature,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            responseCode = response.status;
            responseBody = await response.text();
            success = response.ok;
        } catch (err) {
            responseBody = err.message;
            responseCode = 0; // Network error
        } finally {
            clearTimeout(timeout);
        }

        // 4. Update Logs
        const now = new Date();
        let status = success ? "success" : "pending"; // Pending if we are going to retry
        let nextRetryAt = null;

        if (!success) {
            const isTest = process.env.WEBHOOK_RETRY_INTERVALS_TEST === "true";
            if (currentAttempts >= 5) {
                status = "failed";
            } else {
                const delay = calculateNextRetry(currentAttempts, isTest);
                if (delay !== null) {
                    nextRetryAt = new Date(now.getTime() + delay);
                    // Enqueue retry
                    console.log(`Scheduling retry #${currentAttempts + 1} in ${delay}ms`);
                    await webhookQueue.add(
                        "deliver-webhook",
                        { ...job.data, webhookLogId: logId },
                        { delay }
                    );
                } else {
                    status = 'failed';
                }
            }
        }

        await pool.query(
            `UPDATE webhook_logs 
       SET attempts = $1, response_code = $2, response_body = $3, last_attempt_at = $4, status = $5, next_retry_at = $6
       WHERE id = $7`,
            [currentAttempts, responseCode, responseBody, now, status, nextRetryAt, logId]
        );

    } catch (error) {
        console.error(`Error delivering webhook:`, error);
        throw error;
    }
};

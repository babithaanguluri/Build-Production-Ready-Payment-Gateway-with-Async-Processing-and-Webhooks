import { pool } from "../db/pool.js";
import { QUEUE_NAMES } from "../queues/index.js";
import { Queue } from "bullmq";

// processing delay config
const TEST_PROCESSING_DELAY = 1000;
const TEST_PAYMENT_SUCCESS = true;

const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, {
    connection: {
        url: process.env.REDIS_URL,
    },
});

export const processPayment = async (job) => {
    const { paymentId } = job.data;
    console.log(`Processing payment: ${paymentId}`);

    try {
        // 1. Fetch payment
        const paymentRes = await pool.query(
            "SELECT * FROM payments WHERE id = $1",
            [paymentId]
        );

        if (paymentRes.rows.length === 0) {
            throw new Error(`Payment ${paymentId} not found`);
        }
        const payment = paymentRes.rows[0];

        // 2. Simulate Delay
        let delay = 0;
        if (process.env.TEST_MODE === "true") {
            delay = process.env.TEST_PROCESSING_DELAY
                ? parseInt(process.env.TEST_PROCESSING_DELAY)
                : TEST_PROCESSING_DELAY;
        } else {
            delay = Math.floor(Math.random() * (10000 - 5000 + 1) + 5000); // 5-10s
        }
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 3. Determine Outcome
        let success = false;
        if (process.env.TEST_MODE === "true") {
            success = process.env.TEST_PAYMENT_SUCCESS
                ? process.env.TEST_PAYMENT_SUCCESS === "true"
                : TEST_PAYMENT_SUCCESS;
        } else {
            const rand = Math.random();
            if (payment.method === "upi") {
                success = rand <= 0.9;
            } else {
                success = rand <= 0.95;
            }
        }

        // 4. Update Status
        let status = success ? "success" : "failed";
        let errorCode = null;
        let errorDesc = null;

        if (!success) {
            errorCode = "PAYMENT_FAILED";
            errorDesc = "Simulated payment failure";
        }

        const updatedPayment = await pool.query(
            `UPDATE payments 
       SET status = $1, error_code = $2, error_description = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
            [status, errorCode, errorDesc, paymentId]
        );

        const finalPayment = updatedPayment.rows[0];

        // 5. Enqueue Webhook
        const event = success ? "payment.success" : "payment.failed";
        const payload = {
            event: event,
            timestamp: Math.floor(Date.now() / 1000),
            data: {
                payment: finalPayment,
            },
        };

        await webhookQueue.add("deliver-webhook", {
            merchantId: finalPayment.merchant_id,
            event: event,
            payload: payload,
        });

        return { status, paymentId };
    } catch (error) {
        console.error(`Error processing payment ${paymentId}:`, error);
        throw error;
    }
};

import { pool } from "../db/pool.js";
import { generatePaymentId } from "../utils/payment-id.util.js";
import { isValidVPA } from "../utils/vpa.util.js";
import { isValidCardNumber } from "../utils/luhn.util.js";
import { detectCardNetwork } from "../utils/card-network.util.js";
import { isValidExpiry } from "../utils/expiry.util.js";
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queues/index.js";

const paymentQueue = new Queue(QUEUE_NAMES.PAYMENT, {
  connection: {
    url: process.env.REDIS_URL,
  },
});

// Helper: cache response
const cacheResponse = async (key, merchantId, response) => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await pool.query(
    "INSERT INTO idempotency_keys (key, merchant_id, response, expires_at) VALUES ($1, $2, $3, $4)",
    [key, merchantId, response, expiresAt]
  );
};

// Create Payment
export const createPayment = async (req, res) => {
  const { order_id, method } = req.body;
  const idempotencyKey = req.headers["idempotency-key"];

  // 1. Idempotency Check
  if (idempotencyKey) {
    const keyRes = await pool.query(
      "SELECT response, expires_at FROM idempotency_keys WHERE key = $1 AND merchant_id = $2",
      [idempotencyKey, req.merchant.id]
    );
    if (keyRes.rows.length > 0) {
      const { response, expires_at } = keyRes.rows[0];
      if (new Date(expires_at) > new Date()) {
        return res.status(201).json(response);
      } else {
        // Expired, delete and continue
        await pool.query(
          "DELETE FROM idempotency_keys WHERE key = $1 AND merchant_id = $2",
          [idempotencyKey, req.merchant.id]
        );
      }
    }
  }

  // 2. Validate Order
  const orderResult = await pool.query(
    `SELECT id, amount, currency FROM orders WHERE id = $1 AND merchant_id = $2`,
    [order_id, req.merchant.id]
  );

  if (orderResult.rows.length === 0) {
    return res.status(404).json({
      error: { code: "NOT_FOUND_ERROR", description: "Order not found" },
    });
  }

  const order = orderResult.rows[0];
  const paymentId = generatePaymentId();
  const createdAt = new Date().toISOString();
  let paymentData = {};

  // 3. Validation & Payment Data Prep
  if (method === "upi") {
    const { vpa } = req.body;
    if (!isValidVPA(vpa)) {
      return res.status(400).json({ error: { code: "INVALID_VPA", description: "Invalid VPA" } });
    }
    paymentData = { vpa, method: "upi", status: "pending" };
  } else if (method === "card") {
    const { card } = req.body;
    if (!card) return res.status(400).json({ error: { code: "INVALID_CARD", description: "Invalid card details" } });

    const { number, expiry_month, expiry_year } = card;
    if (!isValidCardNumber(number)) return res.status(400).json({ error: { code: "INVALID_CARD", description: "Invalid card number" } });

    const expiry = `${expiry_month}/${expiry_year}`;
    if (!isValidExpiry(expiry)) return res.status(400).json({ error: { code: "EXPIRED_CARD", description: "Card expired" } });

    const cardNetwork = detectCardNetwork(number);
    const last4 = number.replace(/[\s-]/g, "").slice(-4);

    paymentData = {
      method: "card",
      status: "pending",
      card_network: cardNetwork,
      card_last4: last4
    };
  } else {
    return res.status(400).json({ error: { code: "BAD_REQUEST_ERROR", description: "Unsupported payment method" } });
  }

  // 4. Create Payment Record (Pending)
  const columns = [
    "id", "order_id", "merchant_id", "amount", "currency", "method", "status", "created_at", "updated_at"
  ];
  const values = [
    paymentId, order.id, req.merchant.id, order.amount, order.currency, paymentData.method, "pending", createdAt, createdAt
  ];

  if (paymentData.method === "upi") {
    columns.push("vpa");
    values.push(paymentData.vpa);
  } else {
    columns.push("card_network", "card_last4");
    values.push(paymentData.card_network, paymentData.card_last4);
  }

  const placeholders = values.map((_, i) => `$${i + 1}`).join(",");

  await pool.query(
    `INSERT INTO payments (${columns.join(",")}) VALUES (${placeholders})`,
    values
  );

  // 5. Enqueue Job
  await paymentQueue.add("process-payment", { paymentId });

  // 6. Respond & Cache
  const responseBody = {
    id: paymentId,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    method: paymentData.method,
    status: "pending",
    created_at: createdAt,
    ...(paymentData.method === "upi" ? { vpa: paymentData.vpa } : {
      card_network: paymentData.card_network,
      card_last4: paymentData.card_last4
    })
  };

  if (idempotencyKey) {
    await cacheResponse(idempotencyKey, req.merchant.id, responseBody);
  }

  return res.status(201).json(responseBody);
};

// Capture Payment
export const capturePayment = async (req, res) => {
  const { paymentId } = req.params;
  const { amount } = req.body;

  const resPayment = await pool.query(
    "SELECT * FROM payments WHERE id = $1 AND merchant_id = $2",
    [paymentId, req.merchant.id]
  );

  if (resPayment.rows.length === 0) {
    return res.status(404).json({ error: { code: "NOT_FOUND_ERROR", description: "Payment not found" } });
  }

  const payment = resPayment.rows[0];

  // Implementation note checks "status success" but actually prompt says "Payment not in capturable state".
  // Assume only success can be captured.
  if (payment.status !== 'success') {
    return res.status(400).json({ error: { code: "BAD_REQUEST_ERROR", description: "Payment not in capturable state" } });
  }

  if (payment.captured) {
    return res.status(400).json({ error: { code: "BAD_REQUEST_ERROR", description: "Payment already captured" } });
  }

  // Update captured
  const updateRes = await pool.query(
    "UPDATE payments SET captured = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
    [paymentId]
  );

  const updated = updateRes.rows[0];

  return res.json({
    id: updated.id,
    order_id: updated.order_id,
    amount: updated.amount,
    currency: updated.currency,
    method: updated.method,
    status: updated.status,
    captured: true,
    created_at: new Date(updated.created_at).toISOString(),
    updated_at: new Date(updated.updated_at).toISOString()
  });
};

// Get Payment (Existing logic preserved with minor updates if needed, mostly fine)
export const getPayment = async (req, res) => {
  const { paymentId } = req.params;

  const { rows } = await pool.query(
    `SELECT * FROM payments WHERE id = $1 AND merchant_id = $2`,
    [paymentId, req.merchant.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      error: { code: "NOT_FOUND_ERROR", description: "Payment not found" },
    });
  }

  const payment = rows[0];

  const response = {
    id: payment.id,
    order_id: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    captured: payment.captured,
    created_at: new Date(payment.created_at).toISOString(),
    updated_at: new Date(payment.updated_at).toISOString(),
  };

  if (payment.method === "upi") {
    response.vpa = payment.vpa;
  } else {
    response.card_network = payment.card_network;
    response.card_last4 = payment.card_last4;
  }

  if (payment.status === "failed") {
    response.error = {
      code: payment.error_code,
      description: payment.error_description
    };
  }

  return res.status(200).json(response);
};

import { pool } from "../db/pool.js";
import { generateOrderId } from "../utils/id.util.js";

// Create Order
export const createOrder = async (req, res) => {
  const { amount, currency = "INR", receipt = null, notes = {} } = req.body;

  // Validation
  if (!Number.isInteger(amount) || amount < 100) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "amount must be at least 100",
      },
    });
  }

  const orderId = generateOrderId();
  const createdAt = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO orders (
        id,
        merchant_id,
        amount,
        currency,
        receipt,
        notes,
        status,
        created_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        orderId,
        req.merchant.id,
        amount,
        currency,
        receipt,
        JSON.stringify(notes || {}), // ensure notes is always a JSON string
        "created",
        createdAt,
        createdAt,
      ]
    );

    return res.status(201).json({
      id: orderId,
      merchant_id: req.merchant.id,
      amount,
      currency,
      receipt,
      notes: notes || {}, // return notes exactly as object
      status: "created",
      created_at: createdAt,
      updated_at: createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Unable to create order",
      },
    });
  }
};

// Get Order
export const getOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at
       FROM orders
       WHERE id = $1
       AND merchant_id = $2`,
      [orderId, req.merchant.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Order not found",
        },
      });
    }

    const order = rows[0];

    // Parse notes JSON safely
    try {
      order.notes = order.notes ? JSON.parse(order.notes) : {};
    } catch {
      order.notes = {};
    }

    // Ensure timestamps are ISO format
    order.created_at = new Date(order.created_at).toISOString();
    order.updated_at = new Date(order.updated_at).toISOString();

    return res.status(200).json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found",
      },
    });
  }
};

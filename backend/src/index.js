import express from "express";
import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import { authenticateMerchant } from "./middleware/auth.middleware.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import refundRoutes from "./routes/refund.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import testRoutes from "./routes/test.routes.js";
import { pool } from "./db/pool.js";

import cors from "cors";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000", // dashboard (nginx/react)
    "http://localhost:5173", // vite dev (optional)
    "http://localhost:3001"  // checkout
  ],
  allowedHeaders: [
    "Content-Type",
    "X-Api-Key",
    "X-Api-Secret"
  ],
  methods: ["GET", "POST", "OPTIONS"]
}));

app.use(express.json());

// Public
app.use(healthRoutes);
app.use(checkoutRoutes);
app.use(testRoutes);


app.get("/api/v1/test/merchant", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, api_key
     FROM merchants
     WHERE email = 'test@example.com'
     LIMIT 1`
  );

  if (rows.length === 0) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Test merchant not found",
      },
    });
  }

  const merchant = rows[0];

  return res.status(200).json({
    id: merchant.id,
    email: merchant.email,
    api_key: merchant.api_key,
    seeded: true,
  });
});

// Auth required below
app.use(authenticateMerchant);
app.use(dashboardRoutes);

// Orders
app.use(orderRoutes);
app.use(paymentRoutes);
app.use(refundRoutes);
app.use(webhookRoutes);

app.listen(env.PORT, () => {
  console.log(`API running on port ${env.PORT}`);
});

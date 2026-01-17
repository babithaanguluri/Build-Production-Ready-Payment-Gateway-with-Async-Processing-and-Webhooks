import { pool } from "../db/pool.js";

export const getDashboardStats = async (req, res) => {
  const merchantId = req.merchant.id;

  const totalTxResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM payments WHERE merchant_id = $1",
    [merchantId]
  );

  const successTxResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM payments WHERE merchant_id = $1 AND status = 'success'",
    [merchantId]
  );

  const totalAmountResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0)::int AS total_amount
    FROM payments
    WHERE merchant_id = $1 AND status = 'success'
    `,
    [merchantId]
  );

  const totalTransactions = totalTxResult.rows[0].count;
  const successfulTransactions = successTxResult.rows[0].count;
  const totalAmount = totalAmountResult.rows[0].total_amount;

  const successRate =
    totalTransactions === 0
      ? 0
      : Math.round((successfulTransactions / totalTransactions) * 100);

  return res.json({
    total_transactions: totalTransactions,
    total_amount: totalAmount,
    success_rate: successRate,
  });
};

export const getDashboardTransactions = async (req, res) => {
  const merchantId = req.merchant.id;

  const result = await pool.query(
    `
    SELECT id, order_id, amount, method, status, created_at
    FROM payments
    WHERE merchant_id = $1
    ORDER BY created_at DESC
    `,
    [merchantId]
  );

  return res.json({ transactions: result.rows });
};


export const getMerchantConfig = async (req, res) => {
  const { webhook_url, webhook_secret } = req.merchant;
  return res.json({ webhook_url, webhook_secret });
};

export const updateMerchantConfig = async (req, res) => {
  const { webhook_url } = req.body;
  await pool.query(
    "UPDATE merchants SET webhook_url = $1 WHERE id = $2",
    [webhook_url, req.merchant.id]
  );
  return res.json({ success: true });
};

export const regenerateSecret = async (req, res) => {
  const importCrypto = await import("crypto");
  const newSecret = "whsec_" + importCrypto.randomBytes(16).toString("hex");
  await pool.query(
    "UPDATE merchants SET webhook_secret = $1 WHERE id = $2",
    [newSecret, req.merchant.id]
  );
  return res.json({ webhook_secret: newSecret });
};

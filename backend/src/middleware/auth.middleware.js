import { pool } from "../db/pool.js";

export const authenticateMerchant = async (req, res, next) => {
  const apiKey = req.header("X-Api-Key");
  const apiSecret = req.header("X-Api-Secret");

  if (!apiKey || !apiSecret) {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_ERROR",
        description: "Invalid API credentials",
      },
    });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM merchants
       WHERE api_key = $1
       AND api_secret = $2
       AND is_active = true`,
      [apiKey, apiSecret]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_ERROR",
          description: "Invalid API credentials",
        },
      });
    }

    req.merchant = rows[0];
    next();
  } catch (err) {
    return res.status(500).json({
      error: {
        code: "AUTHENTICATION_ERROR",
        description: "Authentication failed",
      },
    });
  }
};

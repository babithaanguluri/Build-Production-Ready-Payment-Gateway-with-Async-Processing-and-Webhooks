import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const checkDatabase = async () => {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    return false;
  }
};

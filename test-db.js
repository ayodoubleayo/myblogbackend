require("dotenv").config();
const { Pool } = require("pg");

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    console.log("⏳ Testing database connection...");

    const result = await db.query("SELECT NOW()");
    console.log("✅ Database connected!");
    console.log("Current time:", result.rows[0]);

    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error(error);
    process.exit(1);
  }
}

testConnection();

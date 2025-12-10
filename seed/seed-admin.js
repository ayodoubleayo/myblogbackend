require("dotenv").config();
const db = require("../db");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@ayo.local";
    const password = process.env.ADMIN_PASSWORD || "password123";
    const pwHash = await bcrypt.hash(password, 10);

    // Create users table existence is handled by migrations
    const exists = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0) {
      console.log("Admin already exists:", email);
      process.exit(0);
    }

    await db.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
      [email, pwHash, "admin"]
    );

    console.log("Seeded admin:", email);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();

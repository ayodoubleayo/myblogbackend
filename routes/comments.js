const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth"); // not required for posting comments if you want public

const router = express.Router();

// Get comments for a post: GET /api/comments?post_id=123
router.get("/", async (req, res) => {
  try {
    const post_id = req.query.post_id;
    if (!post_id) return res.status(400).json({ error: "post_id required" });
    const result = await db.query("SELECT id, post_id, author, body, created_at FROM comments WHERE post_id = $1 ORDER BY created_at ASC", [post_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// Create comment: POST /api/comments { post_id, author, body } 
router.post("/", async (req, res) => {
  try {
    const { post_id, author } = req.body;
    // Accept either `body` or legacy `content`
    const bodyText = req.body.body ?? req.body.content;

    if (!post_id || !author || !bodyText) {
      return res.status(400).json({ error: "post_id, author, body required" });
    }

    const result = await db.query(
      "INSERT INTO comments (post_id, author, body) VALUES ($1, $2, $3) RETURNING id, post_id, author, body, created_at",
      [post_id, author, bodyText]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /comments error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;

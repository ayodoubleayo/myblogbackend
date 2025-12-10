// C:\Users\HomePC\myblogbackend\routes\posts.js
const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

// Helper: parse pagination params
function parsePagination(req) {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || "10", 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// GET /api/posts?search=...&page=1&limit=10
router.get("/", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    const search = (req.query.search || "").trim();

    let rows, totalRes;
    if (search) {
      const q = `%${search}%`;
      const sql = `
        SELECT id, title, slug, excerpt, content, image_url, published, views, likes_count, created_at
        FROM posts
        WHERE (title ILIKE $1 OR excerpt ILIKE $1 OR content ILIKE $1)
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      rows = (await db.query(sql, [q, limit, offset])).rows;

      totalRes = await db.query(
        `SELECT COUNT(*) FROM posts WHERE (title ILIKE $1 OR excerpt ILIKE $1 OR content ILIKE $1)`,
        [q]
      );
    } else {
      rows = (await db.query(
        `SELECT id, title, slug, excerpt, content, image_url, published, views, likes_count, created_at FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      )).rows;
      totalRes = await db.query(`SELECT COUNT(*) FROM posts`);
    }

    const total = parseInt(totalRes.rows[0].count, 10);
    res.json({ data: rows, meta: { total, page, limit } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Slug route
router.get("/slug/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const result = await db.query(
      "SELECT id, title, slug, excerpt, content, image_url, published, views, likes_count, created_at FROM posts WHERE slug = $1",
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET by id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query(
      "SELECT id, title, slug, excerpt, content, image_url, published, views, likes_count, created_at FROM posts WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE post
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, slug, excerpt, content, image_url = null, published = false } = req.body;
    if (!title || !slug) return res.status(400).json({ error: "title and slug required" });

    const result = await db.query(
      `INSERT INTO posts (title, slug, excerpt, content, image_url, published) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, slug, excerpt, content, image_url, published, views, likes_count, created_at`,
      [title, slug, excerpt, content, image_url, published]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE post
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM posts WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE post
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, slug, excerpt, content, image_url = null, published = false } = req.body;
    if (!title || !slug) return res.status(400).json({ error: "title and slug required" });

    const result = await db.query(
      `UPDATE posts SET title = $1, slug = $2, excerpt = $3, content = $4, image_url = $5, published = $6 WHERE id = $7 RETURNING id, title, slug, excerpt, content, image_url, published, views, likes_count, created_at`,
      [title, slug, excerpt, content, image_url, published, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Increment views
router.post("/:id/views", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query(
      `UPDATE posts SET views = COALESCE(views,0) + 1 WHERE id = $1 RETURNING views`,
      [id]
    );
    res.json({ views: result.rows[0].views });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Toggle like (if user provided, record in post_likes). For simplicity accept optional user_id
router.post("/:id/like", async (req, res) => {
  try {
    const id = req.params.id;
    const { user_id } = req.body; // optional
    if (user_id) {
      await db.query(`INSERT INTO post_likes (post_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id, user_id]);
      const cnt = (await db.query(`SELECT COUNT(*) FROM post_likes WHERE post_id = $1`, [id])).rows[0].count;
      await db.query(`UPDATE posts SET likes_count = $1 WHERE id = $2`, [parseInt(cnt, 10), id]);
      return res.json({ likes_count: parseInt(cnt, 10) });
    } else {
      const result = await db.query(`UPDATE posts SET likes_count = COALESCE(likes_count,0) + 1 WHERE id = $1 RETURNING likes_count`, [id]);
      return res.json({ likes_count: result.rows[0].likes_count });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

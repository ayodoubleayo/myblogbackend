import express from "express";
import { upload } from "../middleware/upload.js";

const router = express.Router();

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://myblogbackend-3559.onrender.com"   // <-- MUST BE HTTPS
    : "http://localhost:5000";

router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;

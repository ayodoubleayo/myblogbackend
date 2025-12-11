// C:\Users\HomePC\myblogbackend\server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const postsRoutes = require("./routes/posts");
const authRoutes = require("./routes/auth");
const commentsRoutes = require("./routes/comments");
const { upload, UPLOAD_DIR } = require("./middleware/upload");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, UPLOAD_DIR);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Created uploads directory:", uploadsPath);
}

// serve uploaded files
app.use("/uploads", express.static(uploadsPath));

app.use(
  cors({
origin: (origin, callback) => {
  callback(null, true);
},
credentials: true,
    credentials: true,
  })
);

// routes
app.use("/api/posts", postsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/comments", commentsRoutes);

// image/video upload route (single file field: 'image')
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const backendUrl =
    process.env.NODE_ENV === "production"
      ? "https://myblogbackend-3559.onrender.com"
      : "http://localhost:5000";

  const imageUrl = `${backendUrl}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});


app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

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

// ALWAYS use HTTPS backend for image URLs
const BACKEND_URL = "https://myblogbackend-3559.onrender.com";

app.use(express.json());
app.use(cookieParser());

// ensure uploads directory exists
const uploadsPath = path.join(__dirname, UPLOAD_DIR);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Created uploads dir:", uploadsPath);
}

// serve static uploads folder
app.use("/uploads", express.static(uploadsPath));

/* ---------------------------------------------
   UPDATED CORS — STRICT ORIGINS + COOKIES
---------------------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "https://myblogfrontend-1p3y.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile / postman

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ---------------------------------------------
   ROUTES
---------------------------------------------- */
app.use("/api/posts", postsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/comments", commentsRoutes);

/* ---------------------------------------------
   SINGLE IMAGE UPLOAD
---------------------------------------------- */
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const httpsImageUrl = `${BACKEND_URL}/uploads/${req.file.filename}`;

  res.json({ url: httpsImageUrl });
});

/* ---------------------------------------------
   HEALTH CHECK
---------------------------------------------- */
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

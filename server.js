// server.js
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

// Use env var if set (recommended)
const BACKEND_URL = process.env.BACKEND_URL || "https://myblogbackend-3559.onrender.com";

app.use(express.json());
app.use(cookieParser());

// Ensure uploads dir exists
const uploadsPath = path.join(__dirname, UPLOAD_DIR || "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Created uploads dir:", uploadsPath);
}
app.use("/uploads", express.static(uploadsPath));

/* ---------------------------------------------
   CORS — allow listed origins + any vercel preview
---------------------------------------------- */
// exact origins you want to allow (add any additional domains here)
const allowedOrigins = [
  "http://localhost:3000",

  // explicit production / preview domains you have used
  "https://myblogfrontend-1p3y-bqz0th43q-ayodoubleayos-projects.vercel.app",
  "https://myblogfrontend-1p3y-ekrdvebdi-ayodoubleayos-projects.vercel.app",
  "https://myblogfrontend-1p3y.vercel.app", // if you have this canonical domain
];

// helper to test allowed origin
function isOriginAllowed(origin) {
  if (!origin) return true; // allow non-browser tools like Postman
  if (allowedOrigins.includes(origin)) return true;

  // allow any vercel deployment domain (preview or project)
  if (/\.vercel\.app$/.test(origin)) return true;

  // allow specific hostnames you may add via env (comma separated)
  if (process.env.EXTRA_ALLOWED_ORIGINS) {
    const extras = process.env.EXTRA_ALLOWED_ORIGINS.split(",").map(s => s.trim());
    if (extras.includes(origin)) return true;
  }

  return false;
}

app.use(
  cors({
    origin: function (origin, callback) {
      // debug: uncomment to log incoming origins
      // console.log("CORS check origin:", origin);
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  })
);

/* ---------------------------------------------
   ROUTES
---------------------------------------------- */
app.use("/api/posts", postsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/comments", commentsRoutes);

/* ---------------------------------------------
   IMAGE UPLOAD
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
  console.log(`Backend running on http://localhost:${PORT} (port ${PORT})`);
});

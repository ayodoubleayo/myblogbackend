// C:\Users\HomePC\myblogbackend\middleware\upload.js
const multer = require("multer");
const path = require("path");

const UPLOAD_DIR = "uploads/";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safe = file.originalname.replace(/\s+/g, "-");
    cb(null, Date.now() + "-" + safe);
  },
});

// Allow common image & video MIME types
const allowed = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // mov
];

const fileFilter = (req, file, cb) => {
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = { upload, UPLOAD_DIR };

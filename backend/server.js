const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ── Middleware ──────────────────────────────
// Cho phép Frontend (khác port) gọi API
app.use(cors());

// Cho phép đọc JSON từ request body
app.use(express.json());

// Cho phép đọc form data
app.use(express.urlencoded({ extended: true }));

// Thư mục uploads truy cập được qua URL
// VD: http://localhost:3000/uploads/cv_123.pdf
app.use("/uploads", express.static("uploads"));

// ── Routes ─────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/jobs", require("./routes/job.routes"));
app.use("/api/cv", require("./routes/cv.routes"));

// ── Test route ─────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "JobFit API đang chạy!" });
});

// ── Khởi động server ───────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

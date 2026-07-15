const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ── Middleware ──────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Xử lý preflight OPTIONS ← THÊM DÒNG NÀY

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ── Routes ─────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/jobs", require("./routes/job.routes"));
app.use("/api/cv", require("./routes/cv.routes"));

app.get("/", (req, res) => {
  res.json({ message: "JobFit API đang chạy!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

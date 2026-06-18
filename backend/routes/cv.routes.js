const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  uploadCV,
  getMyCVs,
  deleteCV,
} = require("../controllers/cv.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Cấu hình multer lưu file vào thư mục uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Đặt tên file: timestamp + tên gốc để tránh trùng
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// Chỉ cho phép upload PDF
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".pdf") {
      return cb(new Error("Chỉ chấp nhận file PDF"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Tối đa 5MB
});

// Tất cả route đều cần đăng nhập
router.post("/", verifyToken, upload.single("cv"), uploadCV);
router.get("/", verifyToken, getMyCVs);
router.delete("/:id", verifyToken, deleteCV);

module.exports = router;

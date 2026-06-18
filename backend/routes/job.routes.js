const express = require("express");
const router = express.Router();
const {
  getAllJobs,
  getJobById,
  createJob,
  deleteJob,
} = require("../controllers/job.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Ai cũng xem được danh sách và chi tiết job
router.get("/", getAllJobs);
router.get("/:id", getJobById);

// Chỉ employer đã đăng nhập mới được đăng/xóa tin
router.post("/", verifyToken, createJob);
router.delete("/:id", verifyToken, deleteJob);

module.exports = router;

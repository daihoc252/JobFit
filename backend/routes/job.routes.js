const express = require("express");
const router = express.Router();
const {
  getAllJobs,
  getJobById,
  createJob,
  deleteJob,
  toggleJobStatus,
  getMyJobs,
} = require("../controllers/job.controller");
const { verifyToken, verifyPremium } = require("../middleware/auth.middleware");
// Ai cũng xem được danh sách và chi tiết job
router.get("/", getAllJobs);
router.get("/:id", getJobById);

// Phải premium mới đăng/xóa tin
router.post("/", verifyToken, verifyPremium, createJob);
router.delete("/:id", verifyToken, verifyPremium, deleteJob);
router.patch("/:id/status", verifyToken, verifyPremium, toggleJobStatus);
router.get("/my-jobs", verifyToken, getMyJobs);

module.exports = router;

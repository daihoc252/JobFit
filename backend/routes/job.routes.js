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

// ── Public routes ───────────────────────────
router.get("/", getAllJobs);
router.get("/my-jobs", verifyToken, getMyJobs); // ← lên TRƯỚC /:id
router.get("/:id", getJobById);

// ── Premium routes ──────────────────────────
router.post("/", verifyToken, verifyPremium, createJob);
router.delete("/:id", verifyToken, verifyPremium, deleteJob);
router.patch("/:id/status", verifyToken, verifyPremium, toggleJobStatus);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  upgradePremium,
  getMe,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getMe); // lấy thông tin user hiện tại
router.post("/upgrade", verifyToken, upgradePremium); // nâng cấp premium

module.exports = router;

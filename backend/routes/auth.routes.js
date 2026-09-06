const express = require("express");
const router = express.Router();
const {
  register,
  login,
  upgradePremium,
  getMe,
  googleLogin,
  facebookLogin,
  changeRole,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin); // đăng nhập/đăng ký bằng Google
router.post("/facebook", facebookLogin); // đăng nhập/đăng ký bằng Facebook
router.get("/me", verifyToken, getMe); // lấy thông tin user hiện tại
router.post("/upgrade", verifyToken, upgradePremium); // nâng cấp premium
router.patch("/role", verifyToken, changeRole); // tự đổi vai trò ứng viên/NTD

module.exports = router;

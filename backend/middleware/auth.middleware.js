const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Frontend gửi token trong header dạng: "Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có token, vui lòng đăng nhập" });
  }

  try {
    // Giải mã token, lấy thông tin user lưu vào req.user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next(); // Cho phép đi tiếp vào controller
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

module.exports = { verifyToken };

const verifyPremium = async (req, res, next) => {
  try {
    const [users] = await db.query(
      "SELECT is_premium, premium_expires_at, role FROM users WHERE id = ?",
      [req.user.id],
    );

    const user = users[0];

    // Phải là employer
    if (user.role !== "employer") {
      return res
        .status(403)
        .json({ message: "Chỉ nhà tuyển dụng mới được sử dụng chức năng này" });
    }

    // Phải là premium và chưa hết hạn
    if (!user.is_premium || new Date(user.premium_expires_at) < new Date()) {
      return res.status(403).json({
        message: "Bạn cần nâng cấp tài khoản Premium để đăng tin",
        requirePremium: true,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { verifyToken, verifyPremium };

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

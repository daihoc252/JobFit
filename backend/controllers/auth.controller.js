const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ── ĐĂNG KÝ ────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    // Lấy dữ liệu từ request body (do Frontend gửi lên)
    const { name, email, password, role } = req.body;

    // Kiểm tra thiếu thông tin
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    // Kiểm tra email đã tồn tại chưa
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Mã hóa mật khẩu trước khi lưu (10 = độ phức tạp)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu user mới vào database
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
    );

    res
      .status(201)
      .json({ message: "Đăng ký thành công", userId: result.insertId });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── ĐĂNG NHẬP ──────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    // Tìm user theo email
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const user = users[0];

    // So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo token JWT (hạn 7 ngày)
    // Token này Frontend sẽ lưu lại và gửi kèm mỗi request cần đăng nhập
    const token = jwt.sign(
      { id: user.id, role: user.role }, // Thông tin lưu trong token
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES },
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { register, login };

// Lấy thông tin user hiện tại (kèm is_premium)
const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, is_premium, premium_expires_at FROM users WHERE id = ?",
      [req.user.id],
    );
    if (users.length === 0)
      return res.status(404).json({ message: "User không tồn tại" });
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Nâng cấp premium (giả lập thanh toán)
const upgradePremium = async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' hoặc 'yearly'

    // Tính ngày hết hạn
    const expires = new Date();
    if (plan === "yearly") {
      expires.setFullYear(expires.getFullYear() + 1);
    } else {
      expires.setMonth(expires.getMonth() + 1);
    }

    await db.query(
      "UPDATE users SET is_premium = TRUE, premium_expires_at = ? WHERE id = ?",
      [expires, req.user.id],
    );

    res.json({
      message: "Nâng cấp thành công!",
      premium_expires_at: expires,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { register, login, getMe, upgradePremium };

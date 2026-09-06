const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Nhãn hiển thị cho từng provider (thêm provider mới chỉ cần thêm 1 dòng ở đây)
const PROVIDER_LABELS = { google: "Google", facebook: "Facebook" };

// Vai trò hợp lệ duy nhất — dùng chung cho cả validate (changeRole) lẫn
// coerce mặc định (findOrCreateSocialUser) để tránh 2 nơi định nghĩa lệch nhau
const VALID_ROLES = ["candidate", "employer"];

// Tạo JWT (dùng chung cho login thường + Google + Facebook)
const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

// Các trường public của user trả về cho frontend (không bao giờ lộ password)
const toUserDTO = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// Tạo token + trả response đăng nhập thành công — dùng chung cho
// login thường, Google, Facebook để cùng 1 hình dạng response
const sendAuthResponse = (res, user, message) =>
  res.json({ message, token: generateToken(user), user: toUserDTO(user) });

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

    // Tài khoản được tạo qua Google/Facebook thì không có mật khẩu local
    if (!user.password) {
      return res.status(401).json({
        message: `Tài khoản này đăng ký bằng ${PROVIDER_LABELS[user.provider] || "mạng xã hội"}. Vui lòng dùng nút đăng nhập tương ứng.`,
      });
    }

    // So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Token JWT (hạn 7 ngày) — Frontend lưu lại và gửi kèm mỗi request cần đăng nhập
    sendAuthResponse(res, user, "Đăng nhập thành công");
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tìm user theo (provider, provider_id); nếu chưa có nhưng email đã tồn tại
// thì liên kết tài khoản local đó; nếu chưa từng có thì tạo mới với vai trò
// được chọn (role chỉ áp dụng khi tạo mới, tài khoản đã tồn tại thì giữ nguyên)
const findOrCreateSocialUser = async ({
  provider,
  providerId,
  email,
  name,
  role,
}) => {
  const [byProvider] = await db.query(
    "SELECT * FROM users WHERE provider = ? AND provider_id = ?",
    [provider, providerId],
  );
  if (byProvider.length > 0) return byProvider[0];

  const [byEmail] = await db.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  if (byEmail.length > 0) {
    await db.query(
      "UPDATE users SET provider = ?, provider_id = ? WHERE id = ?",
      [provider, providerId, byEmail[0].id],
    );
    return byEmail[0];
  }

  const safeRole = VALID_ROLES.includes(role) ? role : "candidate";
  const [result] = await db.query(
    `INSERT INTO users (name, email, password, role, provider, provider_id)
     VALUES (?, ?, NULL, ?, ?, ?)`,
    [name, email, safeRole, provider, providerId],
  );
  return { id: result.insertId, name, email, role: safeRole };
};

// ── ĐĂNG NHẬP BẰNG GOOGLE ──────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Thiếu credential từ Google" });
    }

    // Xác thực chữ ký + audience của ID token với Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res
        .status(401)
        .json({ message: "Email Google chưa được xác thực" });
    }

    const user = await findOrCreateSocialUser({
      provider: "google",
      providerId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      role,
    });

    sendAuthResponse(res, user, "Đăng nhập Google thành công");
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    res.status(401).json({ message: "Xác thực Google thất bại" });
  }
};

// ── ĐĂNG NHẬP BẰNG FACEBOOK ────────────────────────────────
const facebookLogin = async (req, res) => {
  try {
    const { accessToken, role } = req.body;
    if (!accessToken) {
      return res
        .status(400)
        .json({ message: "Thiếu accessToken từ Facebook" });
    }

    // Xác thực token thực sự do app này cấp (chặn token giả mạo từ app khác)
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`,
    );
    const debugData = await debugRes.json();
    const tokenInfo = debugData.data;

    if (
      !tokenInfo ||
      !tokenInfo.is_valid ||
      String(tokenInfo.app_id) !== process.env.FACEBOOK_APP_ID
    ) {
      return res.status(401).json({ message: "Xác thực Facebook thất bại" });
    }

    // Lấy hồ sơ từ Graph API (không tin dữ liệu do frontend gửi lên)
    const profileRes = await fetch(
      `https://graph.facebook.com/${tokenInfo.user_id}?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
    );
    const profile = await profileRes.json();

    if (!profileRes.ok) {
      console.error("Lỗi gọi Facebook Graph API:", profile);
      return res.status(502).json({ message: "Không thể lấy hồ sơ từ Facebook, vui lòng thử lại" });
    }

    if (!profile.email) {
      return res.status(400).json({
        message:
          "Tài khoản Facebook của bạn chưa cấp quyền email, không thể đăng nhập",
      });
    }

    const user = await findOrCreateSocialUser({
      provider: "facebook",
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      role,
    });

    sendAuthResponse(res, user, "Đăng nhập Facebook thành công");
  } catch (error) {
    console.error("Lỗi đăng nhập Facebook:", error);
    res.status(401).json({ message: "Xác thực Facebook thất bại" });
  }
};

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

// Tự đổi vai trò tài khoản (Ứng viên ↔ Nhà tuyển dụng)
const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }

    await db.query("UPDATE users SET role = ? WHERE id = ?", [
      role,
      req.user.id,
    ]);

    const [users] = await db.query(
      "SELECT id, name, email, role, is_premium, premium_expires_at FROM users WHERE id = ?",
      [req.user.id],
    );
    const user = users[0];

    // Cấp lại token vì token cũ mang theo role cũ
    const token = generateToken(user);
    res.json({ message: "Đã cập nhật vai trò", token, user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  register,
  login,
  getMe,
  upgradePremium,
  googleLogin,
  facebookLogin,
  changeRole,
};

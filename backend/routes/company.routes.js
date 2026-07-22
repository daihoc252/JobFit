const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth.middleware");

// Lấy thông tin công ty của user hiện tại
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM companies WHERE user_id = ?", [
      req.user.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Chưa có thông tin công ty" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Tạo hoặc cập nhật thông tin công ty
router.post("/me", verifyToken, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      contact_email,
      contact_phone,
      website,
    } = req.body;

    if (!name || !contact_email) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập tên công ty và email liên hệ" });
    }

    const [existing] = await db.query(
      "SELECT id FROM companies WHERE user_id = ?",
      [req.user.id],
    );

    if (existing.length > 0) {
      // Cập nhật
      await db.query(
        `UPDATE companies SET name=?, description=?, address=?, contact_email=?, contact_phone=?, website=? WHERE user_id=?`,
        [
          name,
          description,
          address,
          contact_email,
          contact_phone,
          website,
          req.user.id,
        ],
      );
      res.json({ message: "Cập nhật thông tin công ty thành công" });
    } else {
      // Tạo mới
      await db.query(
        `INSERT INTO companies (user_id, name, description, address, contact_email, contact_phone, website) VALUES (?,?,?,?,?,?,?)`,
        [
          req.user.id,
          name,
          description,
          address,
          contact_email,
          contact_phone,
          website,
        ],
      );
      res.json({ message: "Tạo thông tin công ty thành công" });
    }
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;

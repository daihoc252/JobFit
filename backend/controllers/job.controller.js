const db = require("../config/db");

// ── LẤY DANH SÁCH TẤT CẢ JOB ──────────────────────────────
const getAllJobs = async (req, res) => {
  try {
    // Lấy các tham số filter từ URL
    // VD: /api/jobs?location=HCM&title=developer
    const { title, location, job_type } = req.query;

    let sql = `
      SELECT jobs.*, companies.name AS company_name, companies.logo, companies.contact_email, companies.contact_phone
      FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.status = 'open'
    `;
    const params = [];

    // Thêm filter nếu có
    if (title) {
      sql += " AND jobs.title LIKE ?";
      params.push(`%${title}%`);
    }
    if (location) {
      sql += " AND jobs.location LIKE ?";
      params.push(`%${location}%`);
    }
    if (job_type) {
      sql += " AND jobs.job_type = ?";
      params.push(job_type);
    }

    sql += " ORDER BY jobs.created_at DESC";

    const [jobs] = await db.query(sql, params);
    res.json(jobs);
  } catch (error) {
    console.error("Lỗi lấy danh sách job:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── LẤY CHI TIẾT 1 JOB ────────────────────────────────────
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const [jobs] = await db.query(
      `
      SELECT jobs.*, companies.name AS company_name, companies.logo,
             companies.contact_email, companies.contact_phone,
             companies.address, companies.website
      FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = ?
    `,
      [id],
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy việc làm" });
    }

    res.json(jobs[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết job:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── ĐĂNG TIN TUYỂN DỤNG (chỉ employer) ────────────────────
const createJob = async (req, res) => {
  try {
    const { title, description, skills_required, salary, location, job_type } =
      req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập tiêu đề và mô tả" });
    }

    // Lấy company_id từ user đang đăng nhập
    const [companies] = await db.query(
      "SELECT id FROM companies WHERE user_id = ?",
      [req.user.id],
    );

    if (companies.length === 0) {
      return res
        .status(400)
        .json({ message: "Bạn chưa tạo thông tin công ty" });
    }

    const company_id = companies[0].id;

    const [result] = await db.query(
      `INSERT INTO jobs (company_id, title, description, skills_required, salary, location, job_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id,
        title,
        description,
        JSON.stringify(skills_required || []),
        salary,
        location,
        job_type || "full-time",
      ],
    );

    res
      .status(201)
      .json({ message: "Đăng tin thành công", jobId: result.insertId });
  } catch (error) {
    console.error("Lỗi đăng tin:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── XÓA TIN TUYỂN DỤNG ────────────────────────────────────
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra job có thuộc về công ty của user không
    const [jobs] = await db.query(
      `
      SELECT jobs.id FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = ? AND companies.user_id = ?
    `,
      [id, req.user.id],
    );

    if (jobs.length === 0) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa tin này" });
    }

    await db.query("DELETE FROM jobs WHERE id = ?", [id]);
    res.json({ message: "Xóa tin thành công" });
  } catch (error) {
    console.error("Lỗi xóa tin:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // Kiểm tra job thuộc về công ty của user
    const [jobs] = await db.query(
      `
      SELECT jobs.id FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = ? AND companies.user_id = ?
    `,
      [id, req.user.id],
    );

    if (jobs.length === 0) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa tin này" });
    }

    await db.query("UPDATE jobs SET status = ? WHERE id = ?", [status, id]);
    res.json({
      message: `Đã ${status === "open" ? "mở lại" : "đóng"} tin thành công`,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `
      SELECT jobs.*, companies.name AS company_name,
             companies.contact_email, companies.contact_phone
      FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      WHERE companies.user_id = ?
      ORDER BY jobs.created_at DESC
    `,
      [req.user.id],
    );

    res.json(jobs);
  } catch (error) {
    console.error("Lỗi getMyJobs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  deleteJob,
  toggleJobStatus,
  getMyJobs,
};

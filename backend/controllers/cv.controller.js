const db = require("../config/db");
const fs = require("fs");
const PDFParser = require("pdf2json");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── HÀM ĐỌC TEXT TỪ PDF ───────────────────────────────────
const extractTextFromPDF = (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const text = pdfData.Pages.map((page) =>
        page.Texts.map((t) => decodeURIComponent(t.R[0].T)).join(" "),
      ).join("\n");
      resolve(text);
    });

    pdfParser.on("pdfParser_dataError", (err) => {
      reject(err);
    });

    pdfParser.loadPDF(filePath);
  });
};

// ── HÀM GỌI GROQ PHÂN TÍCH CV ────────────────────────────
const analyzeCVWithAI = async (cvText) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Bạn là chuyên gia phân tích CV. Hãy phân tích CV sau và trả về JSON với cấu trúc:
{
  "name": "tên ứng viên",
  "email": "email nếu có",
  "phone": "số điện thoại nếu có",
  "skills": ["kỹ năng 1", "kỹ năng 2"],
  "experience": "số năm kinh nghiệm hoặc mô tả ngắn",
  "education": "trình độ học vấn",
  "summary": "tóm tắt ngắn về ứng viên trong 2-3 câu"
}

Chỉ trả về JSON thuần túy, không giải thích thêm.

CV cần phân tích:
${cvText}`,
      },
    ],
    temperature: 0.3,
  });

  const text = completion.choices[0].message.content;
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};

// ── UPLOAD CV ──────────────────────────────────────────────
const uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file CV" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Lưu vào DB với status pending trước
    const [result] = await db.query(
      `INSERT INTO cvs (user_id, file_name, file_path, status)
       VALUES (?, ?, ?, 'pending')`,
      [req.user.id, fileName, filePath],
    );

    const cvId = result.insertId;

    // Đọc nội dung PDF
    const cvText = await extractTextFromPDF(filePath);

    if (!cvText || cvText.trim().length < 50) {
      await db.query("UPDATE cvs SET status = ? WHERE id = ?", ["error", cvId]);
      return res.status(400).json({
        message: "Không đọc được nội dung CV, vui lòng thử file khác",
      });
    }

    // Gọi Groq phân tích
    const parsedData = await analyzeCVWithAI(cvText);

    // Cập nhật kết quả vào DB
    await db.query("UPDATE cvs SET parsed_data = ?, status = ? WHERE id = ?", [
      JSON.stringify(parsedData),
      "parsed",
      cvId,
    ]);

    res.status(201).json({
      message: "Upload và phân tích CV thành công",
      cvId,
      parsedData,
    });
  } catch (error) {
    console.error("Lỗi upload CV:", error);
    res.status(500).json({ message: "Lỗi server khi xử lý CV" });
  }
};

// ── LẤY DANH SÁCH CV CỦA USER ─────────────────────────────
const getMyCVs = async (req, res) => {
  try {
    const [cvs] = await db.query(
      "SELECT * FROM cvs WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(cvs);
  } catch (error) {
    console.error("Lỗi lấy CV:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ── XÓA CV ────────────────────────────────────────────────
const deleteCV = async (req, res) => {
  try {
    const { id } = req.params;

    const [cvs] = await db.query(
      "SELECT * FROM cvs WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (cvs.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy CV" });
    }

    // Xóa file vật lý khỏi server
    if (fs.existsSync(cvs[0].file_path)) {
      fs.unlinkSync(cvs[0].file_path);
    }

    await db.query("DELETE FROM cvs WHERE id = ?", [id]);
    res.json({ message: "Xóa CV thành công" });
  } catch (error) {
    console.error("Lỗi xóa CV:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { uploadCV, getMyCVs, deleteCV };

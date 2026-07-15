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
        content: `Bạn là chuyên gia đánh giá CV tuyển dụng hàng đầu. Hãy phân tích CV sau và trả về JSON với cấu trúc bên dưới.

Yêu cầu đánh giá:
- Chấm điểm từng khu vực trên thang 10
- Chỉ ra cụ thể điểm chưa tốt
- Đưa ra gợi ý chỉnh sửa giúp CV gây ấn tượng với nhà tuyển dụng
- Nếu khu vực nào không có trong CV thì điểm = 0 và ghi rõ "Chưa có phần này"

Trả về JSON với cấu trúc sau (chỉ JSON thuần túy, không giải thích thêm):
{
  "overall_score": <số từ 1-10>,
  "overall_comment": "<nhận xét tổng quan 1-2 câu>",
  "name": "<tên ứng viên>",
  "email": "<email nếu có>",
  "phone": "<số điện thoại nếu có>",
  "sections": [
    {
      "name": "Thông tin cá nhân",
      "score": <0-10>,
      "status": "<good|warning|bad>",
      "comment": "<nhận xét ngắn>",
      "suggestion": "<gợi ý cải thiện cụ thể hoặc null nếu tốt rồi>",
      "example": "<ví dụ câu/đoạn viết lại tốt hơn hoặc null>"
    },
    {
      "name": "Mục tiêu nghề nghiệp",
      "score": <0-10>,
      "status": "<good|warning|bad>",
      "comment": "<nhận xét ngắn>",
      "suggestion": "<gợi ý cải thiện cụ thể hoặc null>",
      "example": "<ví dụ hoặc null>"
    },
    {
      "name": "Kinh nghiệm làm việc",
      "score": <0-10>,
      "status": "<good|warning|bad>",
      "comment": "<nhận xét ngắn>",
      "suggestion": "<gợi ý cải thiện cụ thể hoặc null>",
      "example": "<ví dụ hoặc null>"
    },
    {
      "name": "Kỹ năng",
      "score": <0-10>,
      "status": "<good|warning|bad>",
      "comment": "<nhận xét ngắn>",
      "suggestion": "<gợi ý cải thiện cụ thể hoặc null>",
      "example": "<ví dụ hoặc null>"
    },
    {
      "name": "Học vấn",
      "score": <0-10>,
      "status": "<good|warning|bad>",
      "comment": "<nhận xét ngắn>",
      "suggestion": "<gợi ý cải thiện cụ thể hoặc null>",
      "example": "<ví dụ hoặc null>"
    },
    {
      "name": "Thành tích & Dự án",
      "score": <0-10>,
      "status": "<good|warning|bad>",
      "comment": "<nhận xét ngắn>",
      "suggestion": "<gợi ý cải thiện cụ thể hoặc null>",
      "example": "<ví dụ hoặc null>"
    }
  ]
}

Quy tắc status:
- good: điểm >= 8
- warning: điểm 5-7
- bad: điểm < 5

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

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

// ── KHUNG TIÊU CHÍ ĐÁNH GIÁ KIỂU ATS (dùng chung cho prompt + validate) ──
// AI chỉ cần chấm từng criteria (điểm lá) — điểm category/tổng được tính lại
// ở code (không tin vào cộng tổng của AI) để đảm bảo luôn khớp con số.
const SCORE_CATEGORIES = [
  {
    key: "core_foundation",
    name: "Nền tảng cơ bản",
    description: "Định dạng, thông tin & chất lượng nội dung",
    criteria: [
      { name: "Định dạng & cấu trúc", max_score: 10 },
      { name: "Khả năng đọc bởi ATS", max_score: 10 },
      { name: "Thông tin liên hệ & tóm tắt", max_score: 10 },
      { name: "Chất lượng hành văn & từ khóa", max_score: 10 },
    ],
  },
  {
    key: "specialized_assessment",
    name: "Đánh giá chuyên sâu",
    description: "Kinh nghiệm & chiều sâu chuyên môn",
    criteria: [
      { name: "Ấn tượng tổng thể", max_score: 8 },
      { name: "Minh chứng kỹ năng/kỹ thuật", max_score: 8 },
      { name: "Dự án / Portfolio", max_score: 8 },
      { name: "Chứng chỉ", max_score: 8 },
      { name: "Am hiểu ngành nghề", max_score: 8 },
    ],
  },
  {
    key: "bonus_factors",
    name: "Điểm cộng khác biệt",
    description: "Các yếu tố tạo điểm nhấn",
    criteria: [
      { name: "Tinh thần học hỏi & phát triển", max_score: 10 },
      { name: "Yếu tố đặc thù ngành", max_score: 10 },
    ],
  },
];

// SCORE_CATEGORIES không đổi khi chạy → tính 1 lần, dùng lại cho mọi request
const SCORE_SCHEMA_FOR_PROMPT = JSON.stringify(
  SCORE_CATEGORIES.map((cat) => ({
    key: cat.key,
    name: cat.name,
    description: cat.description,
    criteria: cat.criteria.map((c) => ({
      name: c.name,
      max_score: c.max_score,
      score: `<0-${c.max_score}>`,
      comment: "<nhận xét ngắn, thẳng thắn>",
      suggestion: "<gợi ý sửa cụ thể, hành động được ngay, hoặc null nếu đã tốt>",
    })),
  })),
  null,
  2,
);

// ── HÀM GỌI GROQ PHÂN TÍCH CV ────────────────────────────
// response_format ép model trả JSON đúng cú pháp; vẫn thử lại 1 lần vì
// model có thể trả JSON hợp lệ nhưng lệch cấu trúc schema mong muốn.
const requestCVAnalysis = async (cvText) => {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `Bạn là chuyên gia đánh giá CV theo chuẩn ATS (Applicant Tracking System) hàng đầu. Phân tích CV sau và trả về JSON THUẦN TÚY (không markdown, không giải thích gì thêm ngoài JSON).

Nguyên tắc:
- Chấm từng "criteria" đúng theo thang điểm "max_score" đã cho sẵn (không tự đổi thang điểm, không thêm/bớt criteria)
- Thẳng thắn, không chấm dễ dãi — nếu CV thiếu hẳn nội dung cho 1 tiêu chí thì cho điểm thấp (0-2) và nêu rõ lý do trong "comment"
- "suggestion": gợi ý sửa cụ thể, hành động được ngay; để null nếu tiêu chí đã tốt (điểm >= 80% max_score)
- "ai_summary": đúng 1 câu, thẳng thắn, nêu đúng vấn đề LỚN NHẤT của CV, giọng văn như chuyên gia tuyển dụng

Trả về đúng cấu trúc JSON sau (giữ nguyên toàn bộ key, tên category/criteria, chỉ điền giá trị vào "score" và "comment"/"suggestion"):
{
  "ai_summary": "<...>",
  "candidate_level": "<một trong: Sinh viên/Mới ra trường | 1-3 năm kinh nghiệm | 3-5 năm kinh nghiệm | Trên 5 năm kinh nghiệm>",
  "target_category": "<lĩnh vực/vị trí CV đang hướng tới, suy luận từ nội dung CV, VD: Frontend Developer>",
  "name": "<tên ứng viên>",
  "email": "<email nếu có>",
  "phone": "<số điện thoại nếu có>",
  "categories": ${SCORE_SCHEMA_FOR_PROMPT}
}

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

const analyzeCVWithAI = async (cvText) => {
  let parsed;
  try {
    parsed = await requestCVAnalysis(cvText);
  } catch (error) {
    console.error("Lỗi phân tích CV lần 1, thử lại:", error.message);
    parsed = await requestCVAnalysis(cvText);
  }

  return normalizeScoreResult(parsed);
};

// ── Tính lại điểm category/tổng từ điểm criteria (không tin vào AI cộng) ──
const normalizeScoreResult = (parsed) => {
  const categoriesByKey = new Map(
    (parsed.categories || []).map((c) => [c.key, c]),
  );

  let overallScore = 0;
  let overallMax = 0;

  const categories = SCORE_CATEGORIES.map((catDef) => {
    const aiCat = categoriesByKey.get(catDef.key) || {};
    const aiCriteriaByName = new Map(
      (aiCat.criteria || []).map((c) => [c.name, c]),
    );

    let catScore = 0;
    let catMax = 0;

    const criteria = catDef.criteria.map((criDef) => {
      const aiCri = aiCriteriaByName.get(criDef.name) || {};
      const score = clampScore(aiCri.score, criDef.max_score);
      catScore += score;
      catMax += criDef.max_score;

      return {
        name: criDef.name,
        max_score: criDef.max_score,
        score,
        comment: aiCri.comment || "Chưa có nhận xét",
        suggestion: aiCri.suggestion || null,
      };
    });

    overallScore += catScore;
    overallMax += catMax;

    return {
      key: catDef.key,
      name: catDef.name,
      description: catDef.description,
      score: catScore,
      max_score: catMax,
      criteria,
    };
  });

  return {
    version: 2,
    overall_score: overallScore,
    overall_max_score: overallMax,
    ai_summary: parsed.ai_summary || "",
    candidate_level: parsed.candidate_level || "",
    target_category: parsed.target_category || "",
    name: parsed.name || "",
    email: parsed.email || "",
    phone: parsed.phone || "",
    categories,
  };
};

const clampScore = (value, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
};
// ── UPLOAD CV ──────────────────────────────────────────────
const uploadCV = async (req, res) => {
  let cvId;
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

    cvId = result.insertId;

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

    // Đánh dấu CV lỗi thay vì để kẹt mãi ở trạng thái "pending"
    if (cvId) {
      try {
        await db.query("UPDATE cvs SET status = ? WHERE id = ?", ["error", cvId]);
      } catch (updateErr) {
        console.error("Lỗi cập nhật trạng thái error cho CV:", updateErr);
      }
    }

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

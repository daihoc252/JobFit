// Khi trang load xong thì chạy
document.addEventListener("DOMContentLoaded", function () {
  // Bước 1: Đọc cvId từ URL
  // VD: result.html?cvId=7  →  cvId = "7"
  const params = new URLSearchParams(window.location.search);
  const cvId = params.get("cvId");

  if (!cvId) {
    window.location.href = "upload-cv.html";
    return;
  }
  loadResult(cvId);
});

async function loadResult(cvId) {
  // Gọi GET /api/cv (trả về mảng tất cả CV của user)
  const res = await apiGet("/cv");

  if (!res.ok) {
    showResultError();
    return;
  }

  // Tìm đúng CV có id khớp với cvId trên URL
  const cv = res.data.find((item) => item.id == cvId);

  if (!cv || !cv.parsed_data) {
    showResultError();
    return;
  }

  // parsed_data đang là string JSON → parse ra object
  const data =
    typeof cv.parsed_data === "string"
      ? JSON.parse(cv.parsed_data)
      : cv.parsed_data;

  // Bước 3: Render ra màn hình (CV mới dùng khung ATS v2,
  // CV cũ (chưa có field "version") thì render theo khung cũ)
  if (data.version === 2) {
    renderHeaderV2(data);
    renderCategoriesV2(data);
  } else {
    renderHeaderV1(data);
    renderSectionsV1(data);
  }

  document.getElementById("resultLoading").style.display = "none";
  document.getElementById("resultContent").style.display = "block";
}

function showResultError() {
  document.getElementById("resultLoading").style.display = "none";
  document.getElementById("resultError").style.display = "block";
}

// ── Xác định mức good/warning/bad theo % điểm ─
function scoreLevel(pct) {
  return pct >= 80 ? "good" : pct >= 50 ? "warning" : "bad";
}

// ============================================
// Khung kết quả kiểu ATS (v2)
// ============================================

function renderHeaderV2(data) {
  const pct = data.overall_max_score
    ? Math.round((data.overall_score / data.overall_max_score) * 100)
    : 0;
  const level = scoreLevel(pct);
  const ringColor =
    level === "good" ? "#10b981" : level === "warning" ? "#f59e0b" : "#ef4444";

  const tags = [];
  if (data.candidate_level) tags.push(`Trình độ: ${data.candidate_level}`);
  if (data.target_category) tags.push(`Lĩnh vực: ${data.target_category}`);

  const passScore = Math.round((data.overall_max_score || 100) * 0.75);

  document.getElementById("resultHeader").innerHTML = `
    <div class="ats-header-top">
      <div class="score-donut" style="--pct:${pct}; --ring-color:${ringColor}">
        <div class="score-donut-inner">
          <span class="score-donut-num">${data.overall_score}</span>
          <span class="score-donut-max">/${data.overall_max_score}</span>
        </div>
      </div>
      <div class="ats-header-info">
        <p class="ai-summary-text">${data.ai_summary || ""}</p>
        <div class="ats-meta-tags">
          ${tags.map((t) => `<span class="ats-meta-tag">${t}</span>`).join("")}
        </div>
      </div>
    </div>
    <div class="ats-hint">
      <span class="ats-hint-icon"><i class="bi bi-info-circle-fill"></i></span>
      <span>CV đạt trên ${passScore} điểm (75%) thường có khả năng vượt qua hệ thống ATS cao hơn.</span>
    </div>
  `;
}

function renderCategoriesV2(data) {
  const html = data.categories
    .map((cat) => {
      const catPct = cat.max_score
        ? Math.round((cat.score / cat.max_score) * 100)
        : 0;
      const catLevel = scoreLevel(catPct);

      const criteriaHtml = cat.criteria
        .map((cri, idx) => renderCriterion(cat.key, cri, idx))
        .join("");

      return `
        <div class="ats-category-card">
          <div class="ats-category-header">
            <div>
              <p class="ats-category-name">${cat.name}</p>
              <p class="ats-category-desc">${cat.description || ""}</p>
            </div>
            <p class="ats-category-score score-${catLevel}">${cat.score}<span>/${cat.max_score}</span></p>
          </div>
          <div class="ats-bar-track">
            <div class="ats-bar-fill fill-${catLevel}" style="width:${catPct}%"></div>
          </div>
          <div class="ats-criteria-list">${criteriaHtml}</div>
        </div>
      `;
    })
    .join("");

  document.getElementById("resultSections").innerHTML = html;
}

function renderCriterion(catKey, cri, idx) {
  const pct = cri.max_score ? Math.round((cri.score / cri.max_score) * 100) : 0;
  const level = scoreLevel(pct);
  const criId = `cri-${catKey}-${idx}`;

  const suggestionHtml = cri.suggestion
    ? `<div class="ats-criterion-suggestion" id="${criId}-sugg" hidden><i class="bi bi-lightbulb-fill"></i> <strong>Gợi ý:</strong> ${cri.suggestion}</div>`
    : "";
  const fixBtnHtml = cri.suggestion
    ? `<button class="btn-fix-now" onclick="toggleSuggestion('${criId}')"><i class="bi bi-pencil-fill"></i> Sửa ngay</button>`
    : "";

  return `
    <div class="ats-criterion">
      <div class="ats-criterion-top">
        <span class="ats-criterion-name">${cri.name}</span>
        <div class="ats-criterion-right">
          <span class="ats-criterion-score score-${level}">${cri.score}/${cri.max_score}</span>
          ${fixBtnHtml}
        </div>
      </div>
      <div class="ats-criterion-bar-track">
        <div class="ats-criterion-bar-fill fill-${level}" style="width:${pct}%"></div>
      </div>
      <p class="ats-criterion-comment">${cri.comment}</p>
      ${suggestionHtml}
    </div>
  `;
}

// Bấm "Sửa ngay" → hiện/ẩn khung gợi ý ngay dưới tiêu chí đó
function toggleSuggestion(criId) {
  const el = document.getElementById(criId + "-sugg");
  if (el) el.hidden = !el.hidden;
}

// ============================================
// Khung kết quả cũ (v1) — vẫn giữ để CV đã phân tích trước đây hiển thị được
// ============================================

function renderHeaderV1(data) {
  const score = data.overall_score;
  const colorClass =
    score >= 8 ? "score-good" : score >= 5 ? "score-warning" : "score-bad";

  document.getElementById("resultHeader").innerHTML = `
    <p class="overall-score ${colorClass}">
      ${score}<span class="overall-score-label">/10</span>
    </p>
    <p class="overall-comment">${data.overall_comment}</p>
  `;
}

function renderSectionsV1(data) {
  const html = data.sections
    .map((section) => {
      const cardClass = section.status; // good / warning / bad
      const badgeClass = "badge-" + section.status;

      const suggestionHtml = section.suggestion
        ? `<p class="section-suggestion"><i class="bi bi-lightbulb-fill"></i> <strong>Gợi ý:</strong> ${section.suggestion}</p>`
        : "";
      const exampleHtml = section.example
        ? `<p class="section-example"><i class="bi bi-pencil-fill"></i> <strong>Ví dụ viết lại:</strong> ${section.example}</p>`
        : "";

      return `
      <div class="section-card ${cardClass}">
        <div class="section-top">
          <p class="section-name">${section.name}</p>
          <div class="section-badge ${badgeClass}">${section.score}</div>
        </div>
        <p class="section-comment">${section.comment}</p>
        ${suggestionHtml}
        ${exampleHtml}
      </div>
    `;
    })
    .join("");

  document.getElementById("resultSections").innerHTML = html;
}

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

  if (!res.ok) return;

  // Tìm đúng CV có id khớp với cvId trên URL
  const cv = res.data.find((item) => item.id == cvId);

  if (!cv || !cv.parsed_data) {
    alert("Không tìm thấy kết quả phân tích!");
    return;
  }

  // parsed_data đang là string JSON → parse ra object
  const data =
    typeof cv.parsed_data === "string"
      ? JSON.parse(cv.parsed_data)
      : cv.parsed_data;

  // Bước 3: Render ra màn hình
  renderHeader(data);
  renderSections(data);
}
function renderHeader(data) {
  const score = data.overall_score;

  // Xác định màu theo điểm
  const colorClass =
    score >= 8 ? "score-good" : score >= 5 ? "score-warning" : "score-bad";

  document.getElementById("resultHeader").innerHTML = `
    <p class="overall-score ${colorClass}">
      ${score}<span class="overall-score-label">/10</span>
    </p>
    <p class="overall-comment">${data.overall_comment}</p>
  `;
}
function renderSections(data) {
  const html = data.sections
    .map((section) => {
      // Xác định class màu theo status
      const cardClass = section.status; // good / warning / bad
      const badgeClass = "badge-" + section.status;

      // Phần gợi ý (chỉ hiện nếu có)
      const suggestionHtml = section.suggestion
        ? `<p class="section-suggestion">${section.suggestion}</p>`
        : "";

      // Phần ví dụ (chỉ hiện nếu có)
      const exampleHtml = section.example
        ? `<p class="section-example">${section.example}</p>`
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

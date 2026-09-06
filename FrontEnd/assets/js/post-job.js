/* ============================================
   post-job.js – Logic trang đăng tin tuyển dụng
   ============================================ */

let selectedSkills = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Chưa đăng nhập → về auth
  if (!isLoggedIn()) {
    window.location.href = "auth.html";
    return;
  }

  const user = getCurrentUser();

  // Không phải employer → về trang chủ
  if (user.role !== "employer") {
    showToast("Chỉ nhà tuyển dụng mới được truy cập trang này!", "error");
    setTimeout(() => (window.location.href = "index.html"), 1500);
    return;
  }

  // Kiểm tra premium
  await checkPremium();

  // Khởi tạo các sự kiện
  initFormEvents();

  // Điền tên công ty vào preview
  loadCompanyName();
});

// ── Kiểm tra premium ──────────────────────────
async function checkPremium() {
  try {
    const res = await apiGet("/auth/me");
    if (!res.ok) return;

    const user = res.data;
    const isPremium =
      user.is_premium && new Date(user.premium_expires_at) > new Date();

    if (!isPremium) {
      document.getElementById("premiumGate").style.display = "block";
      document.getElementById("postJobForm").style.display = "none";
    }
  } catch (err) {
    console.error("Lỗi kiểm tra premium:", err);
  }
}

// ── Lấy tên công ty điền vào preview ─────────
async function loadCompanyName() {
  try {
    const res = await apiGet("/auth/me");
    if (res.ok && res.data.company_name) {
      document.getElementById("previewCompany").textContent =
        res.data.company_name;
    }
  } catch (err) {
    /* bỏ qua */
  }
}

// ── Khởi tạo các sự kiện form ────────────────
function initFormEvents() {
  // Live preview khi gõ tiêu đề
  document.getElementById("jobTitle").addEventListener("input", updatePreview);
  document.getElementById("jobType").addEventListener("change", updatePreview);
  document
    .getElementById("jobLocation")
    .addEventListener("change", updatePreview);
  document.getElementById("salaryMin").addEventListener("input", updatePreview);
  document.getElementById("salaryMax").addEventListener("input", updatePreview);
  document
    .getElementById("salaryFixedVal")
    .addEventListener("input", updatePreview);
  document
    .getElementById("salaryType")
    .addEventListener("change", updatePreview);

  // Đếm ký tự mô tả
  document
    .getElementById("jobDescription")
    .addEventListener("input", function () {
      const count = this.value.length;
      const el = document.getElementById("descCount");
      el.textContent = `${count} / 2000 ký tự`;
      el.style.color = count > 2000 ? "var(--error)" : "var(--text-light)";
      updateChecklist();
    });

  // Checklist
  document
    .getElementById("jobTitle")
    .addEventListener("input", updateChecklist);
  document
    .getElementById("jobType")
    .addEventListener("change", updateChecklist);
  document
    .getElementById("jobLocation")
    .addEventListener("change", updateChecklist);
}

// ── Toggle hiển thị salary ────────────────────
function toggleSalary() {
  const type = document.getElementById("salaryType").value;
  document.getElementById("salaryRange").style.display =
    type === "range" ? "flex" : "none";
  document.getElementById("salaryFixed").style.display =
    type === "fixed" ? "flex" : "none";
  updatePreview();
}

// ── Tính chuỗi lương để hiển thị ─────────────
function getSalaryString() {
  const type = document.getElementById("salaryType").value;
  if (type === "negotiable") return "Thỏa thuận";
  if (type === "fixed") {
    const val = document.getElementById("salaryFixedVal").value;
    return val ? `${val} triệu/tháng` : "Chưa nhập";
  }
  const min = document.getElementById("salaryMin").value;
  const max = document.getElementById("salaryMax").value;
  if (min && max) return `${min} – ${max} triệu/tháng`;
  if (min) return `Từ ${min} triệu/tháng`;
  return "Chưa nhập";
}

// ── Xử lý input kỹ năng ──────────────────────
function handleSkillInput(e) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    addSkill();
  }
}

function addSkill() {
  const input = document.getElementById("skillInput");
  const skill = input.value.trim().replace(/,$/, "");
  if (!skill) return;
  if (selectedSkills.includes(skill)) {
    showToast("Kỹ năng này đã được thêm!", "error");
    input.value = "";
    return;
  }

  selectedSkills.push(skill);
  input.value = "";
  renderSkillTags();
  updatePreview();
  updateChecklist();
}

function removeSkill(skill) {
  selectedSkills = selectedSkills.filter((s) => s !== skill);
  renderSkillTags();
  updatePreview();
  updateChecklist();
}

function renderSkillTags() {
  document.getElementById("skillsSelected").innerHTML = selectedSkills
    .map(
      (skill) => `
      <span class="skill-tag">
        ${skill}
        <button onclick="removeSkill('${skill}')" title="Xóa">×</button>
      </span>
    `,
    )
    .join("");
}

// ── Cập nhật live preview ─────────────────────
function updatePreview() {
  const title = document.getElementById("jobTitle").value || "Tên vị trí...";
  const type = document.getElementById("jobType").value;
  const location = document.getElementById("jobLocation").value;
  const salary = getSalaryString();

  document.getElementById("previewTitle").textContent = title;

  document.getElementById("previewMeta").innerHTML = `
    ${location ? `<span><i class="bi bi-geo-alt-fill"></i> ${location}</span>` : '<span style="color:var(--text-light)"><i class="bi bi-geo-alt-fill"></i> Địa điểm</span>'}
    ${type ? `<span><i class="bi bi-briefcase-fill"></i> ${jobTypeLabel(type)}</span>` : '<span style="color:var(--text-light)"><i class="bi bi-briefcase-fill"></i> Loại hình</span>'}
    <span><i class="bi bi-cash-stack"></i> ${salary}</span>
  `;

  document.getElementById("previewSkills").innerHTML = selectedSkills
    .slice(0, 4)
    .map(
      (s) =>
        `<span class="badge badge-purple" style="font-size:11px">${s}</span>`,
    )
    .join("");
}

// ── Cập nhật checklist ────────────────────────
function updateChecklist() {
  const checks = {
    "check-title": !!document.getElementById("jobTitle").value.trim(),
    "check-type": !!document.getElementById("jobType").value,
    "check-location": !!document.getElementById("jobLocation").value,
    "check-desc":
      document.getElementById("jobDescription").value.trim().length >= 20,
    "check-skills": selectedSkills.length > 0,
  };

  Object.entries(checks).forEach(([id, done]) => {
    const el = document.getElementById(id);
    if (done) el.classList.add("done");
    else el.classList.remove("done");
  });
}

// ── Validate form ─────────────────────────────
function validateForm() {
  const errors = [];

  if (!document.getElementById("jobTitle").value.trim()) {
    errors.push("Vui lòng nhập tên vị trí tuyển dụng");
    document.getElementById("jobTitle").classList.add("error");
  } else {
    document.getElementById("jobTitle").classList.remove("error");
  }

  if (!document.getElementById("jobType").value) {
    errors.push("Vui lòng chọn loại hình công việc");
  }

  if (!document.getElementById("jobLocation").value) {
    errors.push("Vui lòng chọn địa điểm làm việc");
  }

  if (document.getElementById("jobDescription").value.trim().length < 20) {
    errors.push("Mô tả công việc tối thiểu 20 ký tự");
    document.getElementById("jobDescription").classList.add("error");
  } else {
    document.getElementById("jobDescription").classList.remove("error");
  }

  if (selectedSkills.length === 0) {
    errors.push("Vui lòng thêm ít nhất 1 kỹ năng yêu cầu");
  }

  return errors;
}

// ── Build salary string để lưu DB ─────────────
function buildSalaryString() {
  const type = document.getElementById("salaryType").value;
  if (type === "negotiable") return "Thỏa thuận";
  if (type === "fixed") {
    const val = document.getElementById("salaryFixedVal").value;
    return val ? `${val} triệu/tháng` : "Thỏa thuận";
  }
  const min = document.getElementById("salaryMin").value;
  const max = document.getElementById("salaryMax").value;
  if (min && max) return `${min} - ${max} triệu/tháng`;
  if (min) return `Từ ${min} triệu/tháng`;
  return "Thỏa thuận";
}

// ── Xử lý đăng tin ───────────────────────────
async function handleSubmit() {
  const errors = validateForm();

  if (errors.length > 0) {
    showToast(errors[0], "error");
    return;
  }

  const btn = document.getElementById("btnSubmit");
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang đăng tin...';

  // Build description đầy đủ
  const desc = document.getElementById("jobDescription").value.trim();
  const benefits = document.getElementById("jobBenefits").value.trim();
  const exp = document.getElementById("jobExperience").value;
  const edu = document.getElementById("jobEducation").value;
  const qty = document.getElementById("jobQuantity").value;
  const deadline = document.getElementById("jobDeadline").value;

  // Ghép thêm thông tin vào description
  let fullDesc = desc;
  if (exp) fullDesc += `\n\n📌 Kinh nghiệm: ${exp}`;
  if (edu) fullDesc += `\n📌 Học vấn: ${edu}`;
  if (qty) fullDesc += `\n📌 Số lượng tuyển: ${qty} người`;
  if (deadline)
    fullDesc += `\n📌 Hạn nộp hồ sơ: ${new Date(deadline).toLocaleDateString("vi-VN")}`;
  if (benefits) fullDesc += `\n\n🎁 Phúc lợi:\n${benefits}`;

  const payload = {
    title: document.getElementById("jobTitle").value.trim(),
    description: fullDesc,
    skills_required: selectedSkills,
    salary: buildSalaryString(),
    location: document.getElementById("jobLocation").value,
    job_type: document.getElementById("jobType").value,
  };

  try {
    const res = await apiPost("/jobs", payload);

    if (res.ok) {
      showToast("Đăng tin thành công!", "success");
      setTimeout(
        () => (window.location.href = "employer-dashboard.html"),
        1500,
      );
    } else {
      showToast(res.data.message || "Đăng tin thất bại!", "error");
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-rocket-takeoff-fill"></i> Đăng tin tuyển dụng';
    }
  } catch (err) {
    showToast("Lỗi kết nối server!", "error");
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-rocket-takeoff-fill"></i> Đăng tin tuyển dụng';
  }
}

// ── Lưu nháp ─────────────────────────────────
function handleDraft() {
  const draft = {
    title: document.getElementById("jobTitle").value,
    description: document.getElementById("jobDescription").value,
    skills: selectedSkills,
    location: document.getElementById("jobLocation").value,
    job_type: document.getElementById("jobType").value,
    salary: buildSalaryString(),
  };
  localStorage.setItem("jobDraft", JSON.stringify(draft));
  showToast("Đã lưu nháp!", "success");
}
// Tải bản lưu
function loadDraft() {
  const draft = JSON.parse(localStorage.getItem("jobDraft"));
  if (!draft) {
    showToast("Không có bản nháp nào!", "error");
    return;
  }

  document.getElementById("jobTitle").value = draft.title || "";
  document.getElementById("jobDescription").value = draft.description || "";
  document.getElementById("jobLocation").value = draft.location || "";
  document.getElementById("jobType").value = draft.job_type || "";

  selectedSkills = draft.skills || [];
  renderSkillTags();
  updatePreview();
  updateChecklist();
  showToast("Đã tải bản nháp!", "success");
}

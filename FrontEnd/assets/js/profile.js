/* ============================================
   profile.js – Logic trang Hồ sơ cá nhân
   ============================================ */

let myCvs = [];
let deleteCvId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Chưa đăng nhập → về trang đăng nhập
  if (!isLoggedIn()) {
    window.location.href = "auth.html";
    return;
  }

  await loadProfile();
});

// ── Load thông tin user hiện tại ──────────────
async function loadProfile() {
  try {
    const res = await apiGet("/auth/me");

    document.getElementById("loadingState").style.display = "none";

    if (!res.ok) {
      showToast("Không thể tải thông tin hồ sơ!", "error");
      return;
    }

    const user = res.data;
    document.getElementById("profileContent").style.display = "block";

    renderProfileHeader(user);

    if (user.role === "candidate") {
      document.getElementById("candidateSection").style.display = "block";
      loadCVs();
    } else if (user.role === "employer") {
      document.getElementById("employerSection").style.display = "block";
    }
  } catch (err) {
    document.getElementById("loadingState").style.display = "none";
    showToast("Lỗi kết nối server!", "error");
  }
}

// ── Render header hồ sơ ────────────────────────
function renderProfileHeader(user) {
  document.getElementById("profileAvatar").textContent = user.name
    ? user.name.charAt(0).toUpperCase()
    : "?";
  document.getElementById("profileName").textContent = user.name || "—";
  document.getElementById("profileEmail").textContent = user.email || "—";

  const roleLabel = user.role === "employer" ? "Nhà tuyển dụng" : "Ứng viên";
  const roleBadgeClass = user.role === "employer" ? "badge-purple" : "badge-blue";

  let badgesHtml = `<span class="badge ${roleBadgeClass}">${roleLabel}</span>`;

  if (user.role === "employer") {
    const isPremium =
      user.is_premium && new Date(user.premium_expires_at) > new Date();

    if (isPremium) {
      const expires = new Date(user.premium_expires_at).toLocaleDateString("vi-VN");
      badgesHtml += `<span class="badge premium-active"><i class="bi bi-gem"></i> Premium · HH: ${expires}</span>`;
    } else {
      badgesHtml += `<a href="pricing.html" class="badge premium-inactive" style="cursor:pointer"><i class="bi bi-unlock-fill"></i> Nâng cấp Premium</a>`;
    }
  }

  document.getElementById("profileBadges").innerHTML = badgesHtml;

  // Nút chuyển vai trò (khắc phục việc tài khoản Google/Facebook luôn tạo
  // mặc định là Ứng viên — cho phép tự chuyển sang Nhà tuyển dụng và ngược lại)
  const nextRole = user.role === "employer" ? "candidate" : "employer";
  const btnSwitch = document.getElementById("btnSwitchRole");
  btnSwitch.innerHTML =
    user.role === "employer"
      ? '<i class="bi bi-arrow-repeat"></i> Chuyển sang Ứng viên'
      : '<i class="bi bi-arrow-repeat"></i> Chuyển sang Nhà tuyển dụng';
  btnSwitch.onclick = () => switchRole(nextRole);
}

// ── Tự đổi vai trò tài khoản ───────────────────
async function switchRole(nextRole) {
  const label = nextRole === "employer" ? "Nhà tuyển dụng" : "Ứng viên";
  if (!confirm(`Chuyển vai trò tài khoản sang "${label}"?`)) return;

  try {
    const res = await apiPatch("/auth/role", { role: nextRole });

    if (res.ok) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      showToast(`Đã chuyển sang ${label}!`, "success");
      setTimeout(() => window.location.reload(), 800);
    } else {
      showToast(res.data.message || "Không thể chuyển vai trò!", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối server!", "error");
  }
}

// ── Load danh sách CV của ứng viên ────────────
async function loadCVs() {
  try {
    const res = await apiGet("/cv");

    document.getElementById("cvLoading").style.display = "none";

    if (!res.ok) {
      showToast("Không thể tải danh sách CV!", "error");
      return;
    }

    myCvs = res.data;
    renderCVList();
  } catch (err) {
    document.getElementById("cvLoading").style.display = "none";
    showToast("Lỗi kết nối server!", "error");
  }
}

// ── Render danh sách CV ────────────────────────
function renderCVList() {
  const list = document.getElementById("cvList");
  const empty = document.getElementById("cvEmpty");

  if (myCvs.length === 0) {
    list.style.display = "none";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  list.style.display = "flex";

  list.innerHTML = myCvs.map((cv) => renderCvCard(cv)).join("");
}

// ── Map trạng thái CV sang nhãn/badge ─────────
function cvStatusInfo(status) {
  const map = {
    pending: { label: '<i class="bi bi-hourglass-split"></i> Đang xử lý', badge: "badge-orange" },
    parsed: { label: '<i class="bi bi-check-circle-fill"></i> Đã phân tích', badge: "badge-green" },
    error: { label: '<i class="bi bi-exclamation-triangle-fill"></i> Lỗi xử lý', badge: "badge-red" },
  };
  return map[status] || { label: status, badge: "badge-blue" };
}

// ── Render 1 thẻ CV ────────────────────────────
function renderCvCard(cv) {
  const info = cvStatusInfo(cv.status);

  return `
    <div class="cv-card ${cv.status}" id="cvCard_${cv.id}">
      <div class="cv-icon"><i class="bi bi-file-earmark-text"></i></div>
      <div class="cv-info">
        <p class="cv-name">${cv.file_name}</p>
        <div class="cv-meta">
          <span class="badge ${info.badge}">${info.label}</span>
          <span><i class="bi bi-calendar3"></i> ${formatDate(cv.created_at)}</span>
        </div>
      </div>
      <div class="cv-actions">
        ${
          cv.status === "parsed"
            ? `<button class="btn-view-cv" onclick="viewCvResult(${cv.id})">Xem kết quả</button>`
            : ""
        }
        <button class="btn-delete-cv" onclick="confirmDeleteCv(${cv.id})"><i class="bi bi-trash3-fill"></i> Xóa</button>
      </div>
    </div>
  `;
}

// ── Xem kết quả phân tích CV ───────────────────
function viewCvResult(id) {
  window.location.href = `result.html?cvId=${id}`;
}

// ── Xác nhận xóa CV ────────────────────────────
function confirmDeleteCv(id) {
  deleteCvId = id;
  document.getElementById("deleteCvModal").style.display = "flex";
  document.getElementById("btnConfirmDeleteCv").onclick = () => deleteCv(id);
}

function closeDeleteCvModal() {
  document.getElementById("deleteCvModal").style.display = "none";
  deleteCvId = null;
}

// ── Xóa CV ──────────────────────────────────────
async function deleteCv(id) {
  const btn = document.getElementById("btnConfirmDeleteCv");
  btn.textContent = "Đang xóa...";
  btn.disabled = true;

  try {
    const res = await apiDelete(`/cv/${id}`);

    closeDeleteCvModal();
    btn.textContent = "Xóa CV";
    btn.disabled = false;

    if (res.ok) {
      myCvs = myCvs.filter((cv) => cv.id !== id);
      renderCVList();
      showToast("Đã xóa CV thành công!", "success");
    } else {
      showToast(res.data.message || "Không thể xóa CV này!", "error");
    }
  } catch (err) {
    closeDeleteCvModal();
    btn.textContent = "Xóa CV";
    btn.disabled = false;
    showToast("Lỗi kết nối server!", "error");
  }
}

// Đóng modal khi click ra ngoài
document.addEventListener("click", (e) => {
  if (e.target.id === "deleteCvModal") closeDeleteCvModal();
});

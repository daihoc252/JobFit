/* ============================================
   auth.js – Quản lý trạng thái đăng nhập
   ============================================ */

/** Lấy thông tin user từ localStorage */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

/** Lấy token */
function getToken() {
  return localStorage.getItem("token");
}

/** Kiểm tra đã đăng nhập chưa */
function isLoggedIn() {
  return !!getToken();
}

/** Đăng xuất */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "auth.html";
}

/**
 * Render khu vực nav-auth:
 * - Chưa đăng nhập: nút Đăng nhập / Đăng ký
 * - Đã đăng nhập: tên user + nút Đăng xuất
 */
function renderNavAuth() {
  const el = document.getElementById("navAuth");
  if (!el) return;

  const user = getCurrentUser();

  if (user) {
    if (user.role === "employer") {
      el.innerHTML = `
        <span style="font-size:14px; color:var(--text-sub)">
          Xin chào, <strong>${user.name}</strong>
        </span>
        <a href="profile.html" class="btn-ghost" style="font-size:13px; padding:7px 14px">
          Hồ sơ
        </a>
        <a href="employer-dashboard.html" class="btn-ghost" style="font-size:13px; padding:7px 14px">
          Dashboard
        </a>
        <a href="post-job.html" class="btn-ghost" style="font-size:13px; padding:7px 14px">
          Đăng tin
        </a>
        <button onclick="logout()" class="btn-primary" style="font-size:13px; padding:7px 14px">
          Đăng xuất
        </button>
      `;
    } else if (user.role === "candidate") {
      el.innerHTML = `
        <span style="font-size:14px; color:var(--text-sub)">
          Xin chào, <strong>${user.name}</strong>
        </span>
        <a href="profile.html" class="btn-ghost" style="font-size:13px; padding:7px 14px">
          Hồ sơ
        </a>
        <a href="upload-cv.html" class="btn-ghost" style="font-size:13px; padding:7px 14px">
          Upload CV
        </a>
        <button onclick="logout()" class="btn-primary" style="font-size:13px; padding:7px 14px">
          Đăng xuất
        </button>
      `;
    } else {
      // Role khác
      el.innerHTML = `
        <span>Xin chào, <strong>${user.name}</strong></span>
        <a href="profile.html" class="btn-ghost" style="font-size:13px; padding:7px 14px">Hồ sơ</a>
        <button onclick="logout()" class="btn-primary">Đăng xuất</button>
      `;
    }
  } else {
    el.innerHTML = `
      <a href="auth.html" class="btn-ghost" style="font-size:13px; padding:7px 14px">Đăng nhập</a>
      <a href="auth.html" class="btn-primary" style="font-size:13px; padding:7px 14px">Đăng ký</a>
    `;
  }
}

/** Toggle mobile menu */
function initNavToggle() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });
}

// Chạy khi trang load
document.addEventListener("DOMContentLoaded", () => {
  renderNavAuth();
  initNavToggle();
});

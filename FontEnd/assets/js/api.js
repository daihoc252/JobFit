/* ============================================
   api.js – Wrapper gọi API Backend dùng chung
   ============================================ */

const API_BASE = 'http://localhost:3000/api';

/**
 * Gọi API có tự động đính kèm token
 * @param {string} endpoint  - VD: '/jobs', '/auth/login'
 * @param {object} options   - Tuỳ chọn fetch (method, body...)
 */
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();

  // Nếu token hết hạn → tự động logout
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
    return;
  }

  return { ok: res.ok, status: res.status, data };
}

// ── Các hàm tiện ích ─────────────────────────

/** GET request */
function apiGet(endpoint) {
  return apiCall(endpoint, { method: 'GET' });
}

/** POST request với body JSON */
function apiPost(endpoint, body) {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/** DELETE request */
function apiDelete(endpoint) {
  return apiCall(endpoint, { method: 'DELETE' });
}

/** POST request với FormData (upload file) */
async function apiUpload(endpoint, formData) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ── Toast notification ───────────────────────
function showToast(message, type = 'default') {
  // Xoá toast cũ nếu có
  const old = document.querySelector('.toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Hiện
  setTimeout(() => toast.classList.add('show'), 10);

  // Tự ẩn sau 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ── Format tiện ích ──────────────────────────

/** Format ngày tháng */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Rút gọn văn bản */
function truncate(str, max = 100) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/** Map job_type sang tiếng Việt */
function jobTypeLabel(type) {
  const map = {
    'full-time': 'Toàn thời gian',
    'part-time': 'Bán thời gian',
    'remote':    'Làm từ xa',
    'intern':    'Thực tập'
  };
  return map[type] || type;
}

/** Map job_type sang badge class */
function jobTypeBadge(type) {
  const map = {
    'full-time': 'badge-blue',
    'part-time': 'badge-orange',
    'remote':    'badge-green',
    'intern':    'badge-purple'
  };
  return map[type] || 'badge-blue';
}

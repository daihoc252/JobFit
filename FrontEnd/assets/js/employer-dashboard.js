/* ============================================
   employer-dashboard.js – Logic Dashboard NTD
   ============================================ */

let allJobs     = [];
let currentTab  = 'all';
let deleteJobId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Chưa đăng nhập → về auth
  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return;
  }

  const user = getCurrentUser();

  // Không phải employer → về trang chủ
  if (user.role !== 'employer') {
    showToast('Chỉ nhà tuyển dụng mới được truy cập!', 'error');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  // Load thông tin user + jobs
  await Promise.all([loadUserInfo(), loadJobs(), loadCompanyProfile()]);
});

// ── Load thông tin user & premium ────────────
async function loadUserInfo() {
  try {
    const res = await apiGet('/auth/me');
    if (!res.ok) return;

    const user = res.data;

    // Cập nhật tiêu đề
    document.getElementById('dashTitle').textContent =
      `Xin chào, ${user.name} 👋`;

    // Hiện trạng thái premium
    const statusEl = document.getElementById('premiumStatus');
    const isPremium = user.is_premium && new Date(user.premium_expires_at) > new Date();

    if (isPremium) {
      const expires = new Date(user.premium_expires_at).toLocaleDateString('vi-VN');
      statusEl.innerHTML = `💎 Premium · HH: ${expires}`;
      statusEl.className = 'premium-status premium-active';
      document.getElementById('statPremium').textContent = 'Premium';
    } else {
      statusEl.innerHTML = `<a href="pricing.html" style="color:inherit">🔓 Nâng cấp Premium</a>`;
      statusEl.className = 'premium-status premium-inactive';
      document.getElementById('statPremium').textContent = 'Free';

      // Disable nút đăng tin nếu không premium
      const btnPost = document.getElementById('btnPostJob');
      btnPost.style.opacity = '0.5';
      btnPost.title = 'Cần Premium để đăng tin';
    }

  } catch (err) {
    console.error('Lỗi load user info:', err);
  }
}

// ── Load danh sách jobs của công ty ──────────
async function loadJobs() {
  try {
    const res = await apiGet('/jobs/my-jobs');

    document.getElementById('loadingJobs').style.display = 'none';

    if (!res.ok) {
      showToast('Không thể tải danh sách tin!', 'error');
      return;
    }

    // Lấy user_id hiện tại để lọc job của mình
    const meRes = await apiGet('/auth/me');
    const myUserId = meRes.ok ? meRes.data.id : null;

    // Lọc chỉ lấy job của công ty mình
    // (Backend trả về company_name, cần lọc theo user)
    allJobs = res.data.filter(job => job.user_id == myUserId || true);

    // Tạm thời lấy tất cả nếu backend chưa filter theo user
    // Khi backend có route riêng thì sửa lại
    allJobs = res.data;

    updateStats();
    renderJobs();

  } catch (err) {
    document.getElementById('loadingJobs').style.display = 'none';
    showToast('Lỗi kết nối server!', 'error');
  }
}

// ── Cập nhật stats ────────────────────────────
function updateStats() {
  const total  = allJobs.length;
  const open   = allJobs.filter(j => j.status === 'open').length;
  const closed = allJobs.filter(j => j.status === 'closed').length;

  document.getElementById('statTotal').textContent  = total;
  document.getElementById('statOpen').textContent   = open;
  document.getElementById('statClosed').textContent = closed;
}

// ── Render danh sách jobs ─────────────────────
function renderJobs() {
  const list = document.getElementById('jobList');
  const empty = document.getElementById('emptyState');

  // Lọc theo tab
  let filtered = allJobs;
  if (currentTab === 'open')   filtered = allJobs.filter(j => j.status === 'open');
  if (currentTab === 'closed') filtered = allJobs.filter(j => j.status === 'closed');

  if (filtered.length === 0) {
    list.style.display  = 'none';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.style.display  = 'block';

  list.innerHTML = `
    <div class="job-list">
      ${filtered.map(job => renderJobRow(job)).join('')}
    </div>
  `;
}

// ── Render 1 dòng job ─────────────────────────
function renderJobRow(job) {
  const skills = typeof job.skills_required === 'string'
    ? JSON.parse(job.skills_required || '[]')
    : (job.skills_required || []);

  const shownSkills = skills.slice(0, 3);
  const moreSkills  = skills.length > 3 ? `+${skills.length - 3}` : '';

  const isOpen = job.status === 'open';

  return `
    <div class="job-row ${job.status}" id="jobRow_${job.id}">
      <div class="job-row-icon">💼</div>

      <div class="job-row-info">
        <p class="job-row-title">${job.title}</p>
        <div class="job-row-meta">
          <span>📍 ${job.location || 'Chưa xác định'}</span>
          <span>💰 ${job.salary || 'Thỏa thuận'}</span>
          <span>
            <span class="badge ${isOpen ? 'badge-green' : 'badge-orange'}">
              ${isOpen ? '🟢 Đang tuyển' : '🔴 Đã đóng'}
            </span>
          </span>
          <span style="color:var(--text-light)">📅 ${formatDate(job.created_at)}</span>
        </div>
        ${shownSkills.length ? `
          <div class="job-row-skills">
            ${shownSkills.map(s => `<span class="badge badge-purple">${s}</span>`).join('')}
            ${moreSkills ? `<span class="badge badge-blue">${moreSkills}</span>` : ''}
          </div>` : ''}
      </div>

      <div class="job-row-actions">
        <button class="btn-view" onclick="viewJob(${job.id})">
          👁 Xem
        </button>
        <button
          class="btn-toggle-status"
          onclick="toggleJobStatus(${job.id}, '${job.status}')"
          title="${isOpen ? 'Đóng tin' : 'Mở lại tin'}"
        >
          ${isOpen ? '⏸ Đóng' : '▶ Mở lại'}
        </button>
        <button class="btn-delete" onclick="confirmDelete(${job.id})">
          🗑 Xóa
        </button>
      </div>
    </div>
  `;
}

// ── Chuyển tab ────────────────────────────────
function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Ẩn tất cả sections
  document.getElementById('jobList').style.display        = 'none';
  document.getElementById('emptyState').style.display     = 'none';
  document.getElementById('loadingJobs').style.display    = 'none';
  document.getElementById('companyProfile').style.display = 'none';

  if (tab === 'profile') {
    document.getElementById('companyProfile').style.display = 'block';
  } else {
    renderJobs();
  }
}

// ── Xem chi tiết job ─────────────────────────
function viewJob(id) {
  window.location.href = `job-detail.html?id=${id}`;
}

// ── Đóng/Mở lại tin ──────────────────────────
async function toggleJobStatus(id, currentStatus) {
  const newStatus = currentStatus === 'open' ? 'closed' : 'open';
  const label     = newStatus === 'open' ? 'mở lại' : 'đóng';

  try {
    // Cần thêm route PATCH /api/jobs/:id vào backend
    const res = await apiCall(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    if (res && res.ok) {
      // Cập nhật local data
      const job = allJobs.find(j => j.id === id);
      if (job) job.status = newStatus;

      updateStats();
      renderJobs();
      showToast(`Đã ${label} tin tuyển dụng!`, 'success');
    } else {
      showToast(`Không thể ${label} tin này!`, 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

// ── Xác nhận xóa tin ─────────────────────────
function confirmDelete(id) {
  deleteJobId = id;
  document.getElementById('deleteModal').style.display = 'flex';

  document.getElementById('btnConfirmDelete').onclick = () => deleteJob(id);
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deleteJobId = null;
}

// ── Xóa tin ──────────────────────────────────
async function deleteJob(id) {
  const btn = document.getElementById('btnConfirmDelete');
  btn.textContent = 'Đang xóa...';
  btn.disabled    = true;

  try {
    const res = await apiDelete(`/jobs/${id}`);

    closeDeleteModal();

    if (res.ok) {
      // Xóa khỏi local data
      allJobs = allJobs.filter(j => j.id !== id);
      updateStats();
      renderJobs();
      showToast('Đã xóa tin tuyển dụng!', 'success');
    } else {
      showToast(res.data.message || 'Không thể xóa tin này!', 'error');
    }
  } catch (err) {
    closeDeleteModal();
    showToast('Lỗi kết nối server!', 'error');
  } finally {
    btn.textContent = 'Xóa tin';
    btn.disabled    = false;
  }
}

// Đóng modal khi click ngoài
document.addEventListener('click', (e) => {
  if (e.target.id === 'deleteModal') closeDeleteModal();
});

// ── Load thông tin công ty ────────────────────
async function loadCompanyProfile() {
  try {
    const res = await apiGet('/company/me');
    if (!res.ok) return;
    const c = res.data;
    document.getElementById('companyName').value    = c.name            || '';
    document.getElementById('companyEmail').value   = c.contact_email   || '';
    document.getElementById('companyPhone').value   = c.contact_phone   || '';
    document.getElementById('companyAddress').value = c.address         || '';
    document.getElementById('companyWebsite').value = c.website         || '';
    document.getElementById('companyDesc').value    = c.description     || '';
    if (c.logo) {
      document.getElementById('logoPreview').innerHTML =
        `<img src="${c.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
    }
  } catch (err) {
    console.error('Lỗi load company:', err);
  }
}

// ── Preview logo ──────────────────────────────
function previewLogo(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('logoPreview').innerHTML =
      `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
  };
  reader.readAsDataURL(input.files[0]);
}

// ── Lưu thông tin công ty ─────────────────────
async function saveCompanyProfile() {
  const name  = document.getElementById('companyName').value.trim();
  const email = document.getElementById('companyEmail').value.trim();

  if (!name || !email) {
    showToast('Vui lòng nhập tên công ty và email liên hệ!', 'error');
    return;
  }

  const payload = {
    name,
    contact_email: email,
    contact_phone: document.getElementById('companyPhone').value.trim(),
    address:       document.getElementById('companyAddress').value.trim(),
    website:       document.getElementById('companyWebsite').value.trim(),
    description:   document.getElementById('companyDesc').value.trim(),
  };

  try {
    const res = await apiPost('/company/me', payload);
    if (res.ok) {
      document.getElementById('companySaveStatus').textContent = '✅ Đã lưu';
      showToast('Lưu thông tin công ty thành công!', 'success');
      setTimeout(() => {
        document.getElementById('companySaveStatus').textContent = '';
      }, 3000);
    } else {
      showToast(res.data.message || 'Lưu thất bại!', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

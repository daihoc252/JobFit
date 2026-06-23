/* ============================================
   index.js – Logic riêng cho trang chủ
   ============================================ */

// Chạy khi trang load xong
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedJobs();
  animateStatCount();
});

// ── Load danh sách việc làm nổi bật ──────────
async function loadFeaturedJobs() {
  const grid = document.getElementById('featuredJobs');

  try {
    const res = await apiGet('/jobs');

    if (!res.ok || !res.data.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📭</div>
          <h3>Chưa có việc làm nào</h3>
          <p>Hãy quay lại sau nhé!</p>
        </div>`;
      return;
    }

    // Chỉ hiển thị 6 job đầu trên trang chủ
    const jobs = res.data.slice(0, 6);
    grid.innerHTML = jobs.map(job => renderJobCard(job)).join('');

    // Cập nhật số liệu stats
    document.getElementById('statJobs').textContent = res.data.length + '+';

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Không thể tải dữ liệu</h3>
        <p>Kiểm tra server có đang chạy không</p>
      </div>`;
  }
}

// ── Render 1 job card ─────────────────────────
function renderJobCard(job) {
  const skills = JSON.parse(job.skills_required || '[]');
  const shownSkills = skills.slice(0, 3);
  const moreSkills  = skills.length > 3 ? `+${skills.length - 3}` : '';

  return `
    <div class="job-card" onclick="goToJob(${job.id})">
      <div class="job-card-top">
        <div class="job-logo">🏢</div>
        <div>
          <p class="job-title">${job.title}</p>
          <p class="job-company">${job.company_name || 'Công ty'}</p>
        </div>
      </div>

      <div class="job-meta">
        <span class="job-meta-item">📍 ${job.location || 'Không xác định'}</span>
        <span class="badge ${jobTypeBadge(job.job_type)}">${jobTypeLabel(job.job_type)}</span>
      </div>

      ${shownSkills.length ? `
        <div class="job-skills">
          ${shownSkills.map(s => `<span class="badge badge-purple">${s}</span>`).join('')}
          ${moreSkills ? `<span class="badge badge-blue">${moreSkills}</span>` : ''}
        </div>` : ''}

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto">
        <span class="job-salary">${job.salary || 'Thỏa thuận'}</span>
        <span style="font-size:12px; color:var(--text-light)">${formatDate(job.created_at)}</span>
      </div>
    </div>`;
}

// ── Điều hướng đến trang chi tiết job ────────
function goToJob(id) {
  window.location.href = `job-detail.html?id=${id}`;
}

// ── Tìm kiếm ──────────────────────────────────
function handleSearch() {
  const keyword  = document.getElementById('heroSearch').value.trim();
  const location = document.getElementById('heroLocation').value;

  const params = new URLSearchParams();
  if (keyword)  params.set('title', keyword);
  if (location) params.set('location', location);

  window.location.href = `search.html?${params.toString()}`;
}

// Bấm Enter trong ô tìm kiếm
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('heroSearch');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSearch();
    });
  }
});

// ── Tìm kiếm nhanh theo tag ───────────────────
function quickSearch(keyword) {
  window.location.href = `search.html?title=${encodeURIComponent(keyword)}`;
}

// ── Animate số liệu stats ─────────────────────
function animateStatCount() {
  // Sẽ được cập nhật sau khi load jobs xong
  // (Xử lý trong loadFeaturedJobs)
}

/* ============================================
   job-detail.js – Logic trang chi tiết việc làm
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Đọc id từ URL: job-detail.html?id=5
  const params = new URLSearchParams(window.location.search);
  const jobId  = params.get('id');

  if (!jobId) {
    window.location.href = 'search.html';
    return;
  }

  loadJobDetail(jobId);
});

// ── Gọi API lấy chi tiết job ─────────────────
async function loadJobDetail(jobId) {
  try {
    const res = await apiGet(`/jobs/${jobId}`);

    // Ẩn loading
    document.getElementById('loadingState').style.display = 'none';

    if (!res.ok) {
      document.getElementById('errorState').style.display = 'block';
      return;
    }

    const job = res.data;

    // Hiện nội dung
    document.getElementById('jobContent').style.display = 'block';

    // Render từng phần
    renderHeader(job);
    renderMetaBar(job);
    renderDescription(job);
    renderSkills(job);
    renderSidebar(job);

    // Đổi title tab
    document.title = `${job.title} – JobFit`;

  } catch (err) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display  = 'block';
  }
}

// ── Render header: logo + tên job + công ty ──
function renderHeader(job) {
  document.getElementById('jobHeader').innerHTML = `
    <div class="job-header-inner">
      <div class="jd-logo">🏢</div>
      <div>
        <h1 class="jd-title">${job.title}</h1>
        <p class="jd-company">${job.company_name || 'Công ty'}</p>
        <div class="jd-badges">
          <span class="badge ${jobTypeBadge(job.job_type)}">
            ${jobTypeLabel(job.job_type)}
          </span>
          <span class="badge ${job.status === 'open' ? 'badge-green' : 'badge-orange'}">
            ${job.status === 'open' ? '🟢 Đang tuyển' : '🔴 Đã đóng'}
          </span>
        </div>
      </div>
    </div>
  `;
}

// ── Render meta bar: lương, địa điểm, ngày đăng ──
function renderMetaBar(job) {
  document.getElementById('jobMetaBar').innerHTML = `
    <div class="meta-block">
      <p class="meta-label">💰 Mức lương</p>
      <p class="meta-value" style="color:var(--primary)">${job.salary || 'Thỏa thuận'}</p>
    </div>
    <div class="meta-block">
      <p class="meta-label">📍 Địa điểm</p>
      <p class="meta-value">${job.location || 'Không xác định'}</p>
    </div>
    <div class="meta-block">
      <p class="meta-label">💼 Loại hình</p>
      <p class="meta-value">${jobTypeLabel(job.job_type)}</p>
    </div>
    <div class="meta-block">
      <p class="meta-label">📅 Ngày đăng</p>
      <p class="meta-value">${formatDate(job.created_at)}</p>
    </div>
  `;
}

// ── Render mô tả công việc ───────────────────
function renderDescription(job) {
  document.getElementById('jobDescription').innerHTML = `
    <h2 class="section-heading">📋 Mô tả công việc</h2>
    <p class="job-description-text">${job.description || 'Chưa có mô tả.'}</p>
  `;
}

// ── Render kỹ năng yêu cầu ───────────────────
function renderSkills(job) {
  const skills = typeof job.skills_required === 'string'
    ? JSON.parse(job.skills_required || '[]')
    : (job.skills_required || []);

  const skillsHtml = skills.length
    ? skills.map(s => `<span class="badge badge-purple">${s}</span>`).join('')
    : '<p style="color:var(--text-light); font-size:14px">Chưa có thông tin kỹ năng</p>';

  document.getElementById('jobSkills').innerHTML = `
    <h2 class="section-heading">🛠 Kỹ năng yêu cầu</h2>
    <div class="skills-wrap">${skillsHtml}</div>
  `;
}

// ── Render sidebar: liên hệ + công ty + CTA ──
function renderSidebar(job) {
  const user = getCurrentUser();

  document.getElementById('jobSidebar').innerHTML = `
    <!-- Thông tin liên hệ -->
    <div class="sidebar-card">
      <p class="sidebar-heading">Thông tin liên hệ</p>
      <p style="font-size:13px; color:var(--text-sub); margin-bottom:14px">
        Ứng viên liên hệ trực tiếp với nhà tuyển dụng qua thông tin bên dưới
      </p>
      <div class="contact-item">
        <div class="contact-icon">📧</div>
        <div>
          <p class="contact-label">Email</p>
          <p class="contact-value">${job.contact_email || 'Chưa cung cấp'}</p>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">📞</div>
        <div>
          <p class="contact-label">Số điện thoại</p>
          <p class="contact-value">${job.contact_phone || 'Chưa cung cấp'}</p>
        </div>
      </div>
      ${job.address ? `
      <div class="contact-item">
        <div class="contact-icon">📍</div>
        <div>
          <p class="contact-label">Địa chỉ</p>
          <p class="contact-value">${job.address}</p>
        </div>
      </div>` : ''}
    </div>

    <!-- Thông tin công ty -->
    <div class="sidebar-card">
      <p class="sidebar-heading">Về công ty</p>
      <p class="company-name">${job.company_name || 'Công ty'}</p>
      ${job.description_company
        ? `<p class="company-info">${truncate(job.description_company, 120)}</p>`
        : ''}
      ${job.website
        ? `<a href="${job.website}" target="_blank" class="company-website">🌐 ${job.website}</a>`
        : ''}
    </div>

    <!-- CTA: Upload CV -->
    ${!user ? `
    <div class="sidebar-cta">
      <h4>Muốn kiểm tra CV của bạn?</h4>
      <p>Đăng nhập và tải CV lên để AI phân tích kỹ năng phù hợp</p>
      <a href="upload-cv.html" class="btn-cta-white">📤 Upload CV ngay</a>
    </div>` : `
    <div class="sidebar-cta">
      <h4>Kiểm tra CV của bạn</h4>
      <p>Tải CV lên để AI phân tích kỹ năng phù hợp với vị trí này</p>
      <a href="upload-cv.html" class="btn-cta-white">📤 Upload CV ngay</a>
    </div>`}
  `;
}

let allJobs = [];
let filteredJobs = [];

document.addEventListener('DOMContentLoaded', () => {
  initSearchPage();
});

function initSearchPage() {
  hydrateSearchFromUrl();
  bindSearchEvents();
  loadJobs();
}

function hydrateSearchFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const title = params.get('title') || params.get('keyword') || '';
  const location = params.get('location') || '';

  document.getElementById('searchKeyword').value = title;
  document.getElementById('searchLocation').value = location;
}

function bindSearchEvents() {
  document.getElementById('searchButton').addEventListener('click', applyFilters);
  document.getElementById('searchKeyword').addEventListener('keydown', event => {
    if (event.key === 'Enter') applyFilters();
  });
  document.getElementById('searchLocation').addEventListener('change', applyFilters);
  document.getElementById('sortJobs').addEventListener('change', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);

  document.querySelectorAll('input[name="jobType"], input[name="match"]').forEach(input => {
    input.addEventListener('change', applyFilters);
  });

  document.querySelectorAll('.quick-filters button').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('searchKeyword').value = button.dataset.keyword;
      applyFilters();
    });
  });
}

async function loadJobs() {
  const list = document.getElementById('jobResults');

  try {
    const res = await apiGet('/jobs');
    allJobs = Array.isArray(res?.data) ? res.data : [];
    applyFilters();
  } catch (error) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h3>Không thể tải danh sách việc làm</h3>
        <p>Vui lòng kiểm tra backend hoặc thử lại sau.</p>
      </div>`;
    document.getElementById('resultsCount').textContent = 'Không tải được dữ liệu';
  }
}

function applyFilters() {
  const keyword = normalizeText(document.getElementById('searchKeyword').value);
  const location = normalizeText(document.getElementById('searchLocation').value);
  const selectedTypes = getCheckedValues('jobType');
  const matchMode = document.querySelector('input[name="match"]:checked')?.value || '';
  const sortMode = document.getElementById('sortJobs').value;

  filteredJobs = allJobs.filter(job => {
    const skills = parseSkills(job.skills_required);
    const searchable = normalizeText([
      job.title,
      job.company_name,
      job.location,
      job.job_type,
      job.description,
      skills.join(' ')
    ].join(' '));

    const matchesKeyword = !keyword || searchable.includes(keyword);
    const normalizedType = normalizeText(job.job_type);
    const matchesLocation = !location
      || normalizeText(job.location).includes(location)
      || (location === 'remote' && normalizedType === 'remote');
    const matchesType = !selectedTypes.length || selectedTypes.includes(job.job_type);
    const matchesMode = matchMode !== 'skill'
      || skills.some(skill => keyword ? normalizeText(skill).includes(keyword) : Boolean(skill));
    const matchesNew = matchMode !== 'new' || isRecentJob(job.created_at);

    return matchesKeyword && matchesLocation && matchesType && matchesMode && matchesNew;
  });

  sortFilteredJobs(sortMode);
  updateUrl();
  renderJobs(filteredJobs);
}

function renderJobs(jobs) {
  const list = document.getElementById('jobResults');
  const count = document.getElementById('resultsCount');

  count.textContent = jobs.length
    ? `Tìm thấy ${jobs.length} việc làm phù hợp`
    : 'Chưa tìm thấy việc làm phù hợp';

  if (!jobs.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">?</div>
        <h3>Không có kết quả phù hợp</h3>
        <p>Hãy thử từ khóa rộng hơn hoặc bỏ bớt bộ lọc.</p>
      </div>`;
    return;
  }

  list.innerHTML = jobs.map(renderSearchJobCard).join('');
}

function renderSearchJobCard(job) {
  const skills = parseSkills(job.skills_required);
  const shownSkills = skills.slice(0, 5);
  const moreSkills = skills.length > 5 ? `+${skills.length - 5}` : '';

  return `
    <article class="job-card" onclick="goToJob(${job.id})">
      <div class="job-card-top">
        <div class="job-logo">${getCompanyInitial(job.company_name)}</div>
        <div>
          <p class="job-title">${escapeHtml(job.title || 'Vị trí tuyển dụng')}</p>
          <p class="job-company">${escapeHtml(job.company_name || 'Công ty')}</p>
        </div>
      </div>

      <div class="job-meta">
        <span class="job-meta-item">${escapeHtml(job.location || 'Không xác định')}</span>
        <span class="badge ${jobTypeBadge(job.job_type)}">${jobTypeLabel(job.job_type)}</span>
        <span class="job-meta-item">${formatDate(job.created_at)}</span>
      </div>

      ${job.description ? `<p class="job-company">${escapeHtml(truncate(job.description, 150))}</p>` : ''}

      ${shownSkills.length ? `
        <div class="job-skills">
          ${shownSkills.map(skill => `<span class="badge badge-purple">${escapeHtml(skill)}</span>`).join('')}
          ${moreSkills ? `<span class="badge badge-blue">${moreSkills}</span>` : ''}
        </div>` : ''}

      <div class="job-card-actions">
        <span class="job-salary">${escapeHtml(job.salary || 'Thỏa thuận')}</span>
        <span class="job-more">Xem chi tiết</span>
      </div>
    </article>`;
}

function clearFilters() {
  document.getElementById('searchKeyword').value = '';
  document.getElementById('searchLocation').value = '';
  document.getElementById('sortJobs').value = 'newest';
  document.querySelectorAll('input[name="jobType"]').forEach(input => input.checked = false);
  document.querySelector('input[name="match"][value=""]').checked = true;
  applyFilters();
}

function updateUrl() {
  const params = new URLSearchParams();
  const keyword = document.getElementById('searchKeyword').value.trim();
  const location = document.getElementById('searchLocation').value;

  if (keyword) params.set('title', keyword);
  if (location) params.set('location', location);

  const query = params.toString();
  const nextUrl = query ? `search.html?${query}` : 'search.html';
  window.history.replaceState(null, '', nextUrl);
}

function sortFilteredJobs(sortMode) {
  filteredJobs.sort((a, b) => {
    if (sortMode === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'vi');
    if (sortMode === 'company') return String(a.company_name || '').localeCompare(String(b.company_name || ''), 'vi');
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(input => input.value);
}

function parseSkills(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(',').map(skill => skill.trim()).filter(Boolean);
  }
}

function isRecentJob(dateValue) {
  if (!dateValue) return false;
  const created = new Date(dateValue);
  const now = new Date();
  const days = (now - created) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getCompanyInitial(name = '') {
  return escapeHtml(String(name).trim().charAt(0).toUpperCase() || 'J');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function goToJob(id) {
  if (!id) return;
  window.location.href = `job-detail.html?id=${id}`;
}

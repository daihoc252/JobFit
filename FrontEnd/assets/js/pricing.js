/* ============================================
   pricing.js – Logic trang bảng giá
   ============================================ */

let currentPlan = 'monthly'; // monthly | yearly

document.addEventListener('DOMContentLoaded', () => {
  initBillingToggle();
  checkCurrentPremium();
});

// ── Toggle tháng / năm ────────────────────────
function initBillingToggle() {
  const toggle      = document.getElementById('billingToggle');
  const labelMonthly = document.getElementById('labelMonthly');
  const labelYearly  = document.getElementById('labelYearly');

  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      currentPlan = 'yearly';
      labelMonthly.classList.remove('active');
      labelYearly.classList.add('active');
      document.getElementById('premiumPrice').textContent  = '4.790.000đ';
      document.getElementById('premiumPeriod').textContent = '/ năm';
      document.getElementById('premiumNote').innerHTML   = '<i class="bi bi-stars"></i> Tiết kiệm ~1.198.000đ so với theo tháng';
      document.getElementById('btnBuyPremium').onclick = () => handleBuyPlan('yearly');
    } else {
      currentPlan = 'monthly';
      labelMonthly.classList.add('active');
      labelYearly.classList.remove('active');
      document.getElementById('premiumPrice').textContent  = '499.000đ';
      document.getElementById('premiumPeriod').textContent = '/ tháng';
      document.getElementById('premiumNote').textContent   = '';
      document.getElementById('btnBuyPremium').onclick = () => handleBuyPlan('monthly');
    }
  });
}

// ── Kiểm tra user đã premium chưa ────────────
async function checkCurrentPremium() {
  if (!isLoggedIn()) return;

  try {
    const res = await apiGet('/auth/me');
    if (!res.ok) return;

    const user = res.data;

    // Nếu đã là premium và chưa hết hạn
    if (user.is_premium && new Date(user.premium_expires_at) > new Date()) {
      const expires = new Date(user.premium_expires_at).toLocaleDateString('vi-VN');
      const btn = document.getElementById('btnBuyPremium');
      btn.innerHTML = `<i class="bi bi-check-circle-fill"></i> Đang dùng Premium (HH: ${expires})`;
      btn.disabled = true;
      btn.style.background = '#10b981';
    }
  } catch (err) {
    console.error('Lỗi kiểm tra premium:', err);
  }
}

// ── Xử lý mua gói ────────────────────────────
function handleBuyPlan(plan) {
  // Chưa đăng nhập → về auth
  if (!isLoggedIn()) {
    showToast('Vui lòng đăng nhập trước!', 'error');
    setTimeout(() => window.location.href = 'auth.html', 1200);
    return;
  }

  const user = getCurrentUser();

  // Phải là employer
  if (user.role !== 'employer') {
    showToast('Chỉ tài khoản nhà tuyển dụng mới cần mua gói!', 'error');
    return;
  }

  // Chuyển sang trang thanh toán kèm plan
  window.location.href = `payment.html?plan=${plan}`;
}

// ── Toggle FAQ ────────────────────────────────
function toggleFaq(btn) {
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');

  // Đóng tất cả
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

  // Mở cái được click (nếu chưa mở)
  if (!isOpen) item.classList.add('open');
}

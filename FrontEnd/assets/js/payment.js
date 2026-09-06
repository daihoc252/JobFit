/* ============================================
   payment.js – Logic trang thanh toán
   ============================================ */

let selectedMethod = 'card';
let selectedPlan   = 'monthly';

const PLANS = {
  monthly: { name: 'Premium Tháng', price: 499000, priceStr: '499.000đ', period: '1 tháng' },
  yearly:  { name: 'Premium Năm',   price: 4790000, priceStr: '4.790.000đ', period: '1 năm' }
};

document.addEventListener('DOMContentLoaded', () => {
  // Chưa đăng nhập → về auth
  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return;
  }

  // Chỉ employer mới vào được
  const user = getCurrentUser();
  if (user.role !== 'employer') {
    showToast('Chỉ tài khoản nhà tuyển dụng mới cần mua gói!', 'error');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  // Lấy plan từ URL
  const params = new URLSearchParams(window.location.search);
  selectedPlan = params.get('plan') === 'yearly' ? 'yearly' : 'monthly';

  renderOrderSummary();
  updateTransferContent();
});

// ── Render tóm tắt đơn hàng ─────────────────
function renderOrderSummary() {
  const plan = PLANS[selectedPlan];

  document.getElementById('summaryPlan').innerHTML = `
    <p class="summary-plan-name"><i class="bi bi-gem"></i> ${plan.name}</p>
    <p class="summary-plan-period">Thời hạn: ${plan.period}</p>
  `;

  const vat = Math.round(plan.price * 0.1);
  const total = plan.price + vat;

  document.getElementById('summaryTotal').innerHTML = `
    <div class="total-row">
      <span>Giá gói</span>
      <span>${plan.priceStr}</span>
    </div>
    <div class="total-row">
      <span>VAT (10%)</span>
      <span>${formatMoney(vat)}đ</span>
    </div>
    <div class="total-final">
      <span>Tổng cộng</span>
      <span class="total-price">${formatMoney(total)}đ</span>
    </div>
  `;
}

// ── Chọn phương thức thanh toán ──────────────
function selectMethod(method) {
  selectedMethod = method;

  document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('formCard').style.display     = 'none';
  document.getElementById('formTransfer').style.display = 'none';

  if (method === 'card') {
    document.getElementById('methodCard').classList.add('active');
    document.getElementById('formCard').style.display = 'block';
    document.getElementById('btnPay').innerHTML = '<i class="bi bi-lock-fill"></i> Thanh toán an toàn';
  } else {
    document.getElementById('methodTransfer').classList.add('active');
    document.getElementById('formTransfer').style.display = 'block';
    document.getElementById('btnPay').innerHTML = '<i class="bi bi-check-circle-fill"></i> Xác nhận đã chuyển khoản';
  }
}

// ── Cập nhật nội dung chuyển khoản ──────────
function updateTransferContent() {
  const user = getCurrentUser();
  if (!user) return;
  const content = `PREMIUM ${user.email}`;
  document.getElementById('transferContent').innerHTML = `
    ${content}
    <button class="btn-copy" onclick="copyText('${content}')">Sao chép</button>
  `;
}

// ── Xử lý thanh toán ─────────────────────────
async function handlePayment() {
  if (selectedMethod === 'card') {
    // Validate form thẻ
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardName   = document.getElementById('cardName').value.trim();
    const cardExpiry = document.getElementById('cardExpiry').value.trim();
    const cardCvv    = document.getElementById('cardCvv').value.trim();

    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      showToast('Vui lòng điền đầy đủ thông tin thẻ!', 'error');
      return;
    }

    if (cardNumber.length < 16) {
      showToast('Số thẻ không hợp lệ!', 'error');
      return;
    }

    if (cardCvv.length < 3) {
      showToast('CVV không hợp lệ!', 'error');
      return;
    }
  }

  // Giả lập xử lý
  const btn = document.getElementById('btnPay');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang xử lý...';

  // Giả lập delay 2 giây
  await new Promise(r => setTimeout(r, 2000));

  try {
    // Gọi API nâng cấp premium
    const res = await apiPost('/auth/upgrade', { plan: selectedPlan });

    if (res.ok) {
      // Cập nhật localStorage
      const user = getCurrentUser();
      user.is_premium = true;
      user.premium_expires_at = res.data.premium_expires_at;
      localStorage.setItem('user', JSON.stringify(user));

      // Hiện modal thành công
      const expires = new Date(res.data.premium_expires_at).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      document.getElementById('modalExpires').textContent = `Hiệu lực đến: ${expires}`;
      document.getElementById('successModal').style.display = 'flex';

    } else {
      showToast(res.data.message || 'Thanh toán thất bại!', 'error');
      btn.disabled = false;
      btn.innerHTML = selectedMethod === 'card' ? '<i class="bi bi-lock-fill"></i> Thanh toán an toàn' : '<i class="bi bi-check-circle-fill"></i> Xác nhận đã chuyển khoản';
    }

  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
    btn.disabled = false;
    btn.innerHTML = selectedMethod === 'card' ? '<i class="bi bi-lock-fill"></i> Thanh toán an toàn' : '<i class="bi bi-check-circle-fill"></i> Xác nhận đã chuyển khoản';
  }
}

// ── Chuyển về dashboard sau khi thành công ───
function goToDashboard() {
  window.location.href = 'employer-dashboard.html';
}

// ── Format số thẻ ─────────────────────────────
function formatCardNumber(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.match(/.{1,4}/g)?.join(' ') || value;
  input.value = value;
}

// ── Format ngày hết hạn ──────────────────────
function formatExpiry(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 2) value = value.slice(0,2) + '/' + value.slice(2);
  input.value = value;
}

// ── Copy text ─────────────────────────────────
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Đã sao chép!', 'success');
  });
}

function copyTransferContent() {
  const user = getCurrentUser();
  copyText(`PREMIUM ${user?.email || ''}`);
}

// ── Format tiền ───────────────────────────────
function formatMoney(amount) {
  return amount.toLocaleString('vi-VN');
}

/* ============================================
   auth-page.js – Logic riêng trang đăng nhập/đăng ký
   ============================================ */

// ── Chuyển tab ──────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));

  if (tab === 'login') {
    document.querySelectorAll('.tab')[0].classList.add('active');
    document.getElementById('form-login').classList.add('active');
  } else {
    document.querySelectorAll('.tab')[1].classList.add('active');
    document.getElementById('form-register').classList.add('active');
  }
}

// ── Hiện thông báo ──────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `msg ${type}`;
}

// ── Đăng nhập ───────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    return showMsg('login-msg', 'Vui lòng nhập đầy đủ thông tin!', 'error');
  }

  const btn = document.querySelector('#form-login .btn');
  btn.disabled = true;
  btn.textContent = 'Đang xử lý...';

  try {
    const res = await apiPost('/auth/login', { email, password });

    if (res.ok) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      showMsg('login-msg', 'Đăng nhập thành công! Đang chuyển hướng...', 'success');

      setTimeout(() => {
        if (res.data.user.role === 'employer') {
          window.location.href = 'index.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 1000);
    } else {
      showMsg('login-msg', res.data.message || 'Đăng nhập thất bại!', 'error');
    }
  } catch (err) {
    showMsg('login-msg', 'Không kết nối được server!', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Đăng nhập';
  }
}

// ── Đăng ký ─────────────────────────────────
async function handleRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;

  if (!name || !email || !password) {
    return showMsg('reg-msg', 'Vui lòng nhập đầy đủ thông tin!', 'error');
  }

  if (password.length < 6) {
    return showMsg('reg-msg', 'Mật khẩu tối thiểu 6 ký tự!', 'error');
  }

  const btn = document.querySelector('#form-register .btn');
  btn.disabled = true;
  btn.textContent = 'Đang xử lý...';

  try {
    const res = await apiPost('/auth/register', { name, email, password, role });

    if (res.ok) {
      showMsg('reg-msg', 'Đăng ký thành công! Vui lòng đăng nhập.', 'success');
      setTimeout(() => switchTab('login'), 1500);
    } else {
      showMsg('reg-msg', res.data.message || 'Đăng ký thất bại!', 'error');
    }
  } catch (err) {
    showMsg('reg-msg', 'Không kết nối được server!', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Đăng ký';
  }
}

// ── Bấm Enter để submit ─────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const loginActive = document.getElementById('form-login').classList.contains('active');
    if (loginActive) handleLogin();
    else handleRegister();
  }
});

// ── Nếu đã đăng nhập rồi thì về trang chủ ──
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }
  loadFacebookSdk();

  if (location.protocol !== 'https:') {
    const hint = document.getElementById('facebookHttpsHint');
    if (hint) hint.style.display = 'block';
  }
});

// ── Xử lý sau khi đăng nhập Google/Facebook thành công ──
function handleSocialLoginSuccess(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.href = 'index.html';
}

// Chỉ coi là đã cấu hình nếu người dùng đã thay giá trị mẫu "YOUR_..."
function isProviderConfigured(id) {
  return typeof id !== 'undefined' && !!id && !id.startsWith('YOUR_');
}
const isGoogleConfigured = isProviderConfigured(
  typeof GOOGLE_CLIENT_ID !== 'undefined' ? GOOGLE_CLIENT_ID : undefined,
);
const isFacebookConfigured = isProviderConfigured(
  typeof FACEBOOK_APP_ID !== 'undefined' ? FACEBOOK_APP_ID : undefined,
);

// Gửi credential/token đăng nhập mạng xã hội lên backend, dùng chung cho
// Google và Facebook — chỉ khác endpoint, payload, và tên hiển thị khi lỗi
async function submitSocialLogin(endpoint, payload, providerLabel) {
  try {
    const res = await apiPost(endpoint, {
      ...payload,
      role: getSelectedSocialRole(),
    });
    if (res.ok) {
      handleSocialLoginSuccess(res.data);
    } else {
      showMsg('login-msg', res.data.message || `Đăng nhập ${providerLabel} thất bại!`, 'error');
    }
  } catch (err) {
    showMsg('login-msg', 'Không kết nối được server!', 'error');
  }
}

// ── Đăng nhập bằng Google (Google Identity Services) ─────
// Được gọi khi script accounts.google.com/gsi/client load xong (onload=)
function initGoogleLogin() {
  if (isLoggedIn()) return;

  if (!isGoogleConfigured || typeof google === 'undefined') {
    document.getElementById('googleNotConfigured').style.display = 'block';
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
  });
  google.accounts.id.renderButton(document.getElementById('googleBtn'), {
    theme: 'outline',
    size: 'large',
    width: 340,
    text: 'continue_with',
  });
}

// Đọc vai trò đang chọn (chỉ có tác dụng khi tạo tài khoản mới)
function getSelectedSocialRole() {
  const el = document.querySelector('input[name="socialRole"]:checked');
  return el ? el.value : 'candidate';
}

function handleGoogleCredential(response) {
  return submitSocialLogin('/auth/google', { credential: response.credential }, 'Google');
}

// ── Đăng nhập bằng Facebook (Facebook JavaScript SDK) ────
window.fbAsyncInit = function () {
  FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v19.0' });
};

function loadFacebookSdk() {
  if (!isFacebookConfigured || document.getElementById('facebook-jssdk')) return;
  const js = document.createElement('script');
  js.id = 'facebook-jssdk';
  js.src = 'https://connect.facebook.net/vi_VN/sdk.js';
  document.body.appendChild(js);
}

function handleFacebookLogin() {
  if (!isFacebookConfigured || typeof FB === 'undefined') {
    showMsg('login-msg', 'Đăng nhập Facebook chưa được cấu hình!', 'error');
    return;
  }

  // Facebook chặn hẳn FB.login() trên trang HTTP kể từ 2018, kể cả localhost/127.0.0.1
  if (location.protocol !== 'https:') {
    showMsg(
      'login-msg',
      'Đăng nhập Facebook chỉ hoạt động khi trang được tải qua HTTPS. Vui lòng dùng Google, hoặc thử lại sau khi trang được triển khai qua HTTPS.',
      'error',
    );
    return;
  }

  FB.login(
    (response) => {
      if (response.authResponse) {
        submitFacebookToken(response.authResponse.accessToken);
      }
    },
    { scope: 'public_profile,email' },
  );
}

function submitFacebookToken(accessToken) {
  return submitSocialLogin('/auth/facebook', { accessToken }, 'Facebook');
}

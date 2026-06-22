const API = "http://localhost:3000/api";

// ── Chuyển tab ──────────────────────────────────────────
function switchTab(tab) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".form")
    .forEach((f) => f.classList.remove("active"));

  if (tab === "login") {
    document.querySelectorAll(".tab")[0].classList.add("active");
    document.getElementById("form-login").classList.add("active");
  } else {
    document.querySelectorAll(".tab")[1].classList.add("active");
    document.getElementById("form-register").classList.add("active");
  }
}

// ── Hiện thông báo ──────────────────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `msg ${type}`;
}

// ── Đăng nhập ───────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    return showMsg("login-msg", "Vui lòng nhập đầy đủ thông tin!", "error");
  }

  const btn = document.querySelector("#form-login .btn");
  btn.disabled = true;
  btn.textContent = "Đang xử lý...";

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Lưu token và thông tin user vào localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMsg(
        "login-msg",
        "Đăng nhập thành công! Đang chuyển hướng...",
        "success",
      );

      // Chuyển hướng theo role
      setTimeout(() => {
        if (data.user.role === "employer") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      }, 1000);
    } else {
      showMsg("login-msg", data.message || "Đăng nhập thất bại!", "error");
    }
  } catch (err) {
    showMsg("login-msg", "Không kết nối được server!", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Đăng nhập";
  }
}

// ── Đăng ký ─────────────────────────────────────────────
async function handleRegister() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;

  if (!name || !email || !password) {
    return showMsg("reg-msg", "Vui lòng nhập đầy đủ thông tin!", "error");
  }

  if (password.length < 6) {
    return showMsg("reg-msg", "Mật khẩu tối thiểu 6 ký tự!", "error");
  }

  const btn = document.querySelector("#form-register .btn");
  btn.disabled = true;
  btn.textContent = "Đang xử lý...";

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (res.ok) {
      showMsg("reg-msg", "Đăng ký thành công! Vui lòng đăng nhập.", "success");
      setTimeout(() => switchTab("login"), 1500);
    } else {
      showMsg("reg-msg", data.message || "Đăng ký thất bại!", "error");
    }
  } catch (err) {
    showMsg("reg-msg", "Không kết nối được server!", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Đăng ký";
  }
}

// ── Enter để submit ─────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const loginActive = document
      .getElementById("form-login")
      .classList.contains("active");
    if (loginActive) handleLogin();
    else handleRegister();
  }
});

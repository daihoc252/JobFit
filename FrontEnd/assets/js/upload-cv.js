/* ============================================
   upload-cv.js – Logic trang Upload CV
   ============================================ */

let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
  // Nếu chưa đăng nhập → về auth.html
  if (!isLoggedIn()) {
    window.location.href = "auth.html";
    return;
  }

  initUploadBox();
});

// ── Khởi tạo upload box ──────────────────────
function initUploadBox() {
  const box = document.getElementById("uploadBox");
  const input = document.getElementById("cvInput");
  const removeBtn = document.getElementById("fileRemove");
  const btnUpload = document.getElementById("btnUpload");

  // Click vào box → mở file picker

  // Chọn file qua input
  input.addEventListener("change", () => {
    if (input.files[0]) handleFileSelect(input.files[0]);
  });

  // Kéo thả
  box.addEventListener("dragover", (e) => {
    e.preventDefault();
    box.classList.add("drag-over");
  });
  box.addEventListener("dragleave", () => box.classList.remove("drag-over"));
  box.addEventListener("drop", (e) => {
    e.preventDefault();
    box.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  // Xóa file đã chọn
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetUpload();
  });
}

// ── Xử lý file được chọn ─────────────────────
function handleFileSelect(file) {
  console.log("File được chọn:", file.name, file.type); // ← thêm dòng này
  // Kiểm tra định dạngx
  if (file.type !== "application/pdf") {
    showUploadMsg("Chỉ chấp nhận file PDF!", "error");
    return;
  }

  // Kiểm tra dung lượng (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showUploadMsg("File quá lớn! Tối đa 5MB.", "error");
    return;
  }

  selectedFile = file;
  window._selectedFile = file; // lưu vào window để debug
  console.log("Đã lưu file:", window._selectedFile);
  console.log("selectedFile đã gán:", selectedFile.name); // ← thêm

  hideUploadMsg();

  // Hiện preview
  document.getElementById("fileName").textContent = file.name;
  document.getElementById("fileSize").textContent = formatFileSize(file.size);
  document.getElementById("filePreview").style.display = "flex";
  document.getElementById("uploadBox").style.display = "none";
}

// ── Gọi API upload ────────────────────────────
async function handleUpload() {
  if (!selectedFile) return;

  const btnUpload = document.getElementById("btnUpload");
  const statusEl = document.getElementById("uploadStatus");
  const statusFill = document.getElementById("statusFill");
  const statusText = document.getElementById("statusText");

  btnUpload.disabled = true;
  btnUpload.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang xử lý...';
  statusEl.style.display = "block";

  // Bước 1: Upload
  statusFill.style.width = "30%";
  statusText.innerHTML = '<i class="bi bi-cloud-arrow-up"></i> Đang tải file lên server...';

  try {
    const formData = new FormData();
    formData.append("cv", selectedFile);
    console.log("Chuẩn bị gọi apiUpload..."); // ← thêm
    const res = await apiUpload("/cv", formData);
    console.log("Kết quả API:", res);

    // Bước 2: Hiện trạng thái AI sau khi có response
    statusFill.style.width = "65%";
    statusText.innerHTML = '<i class="bi bi-robot"></i> AI đang phân tích CV...';

    if (res.ok) {
      // Bước 3: Hoàn tất
      statusFill.style.width = "100%";
      statusText.innerHTML = '<i class="bi bi-check-circle-fill"></i> Phân tích hoàn tất!';

      showUploadMsg(
        "Phân tích CV thành công! Đang chuyển đến trang kết quả...",
        "success",
      );

      setTimeout(() => {
        window.location.href = `result.html?cvId=${res.data.cvId}`;
      }, 1500);
    } else {
      throw new Error(res.data.message || "Lỗi server");
    }
  } catch (err) {
    console.error("LỖI CHI TIẾT:", err); // ← thêm dòng này
    console.error("LỖI MESSAGE:", err.message);
    statusEl.style.display = "none";
    btnUpload.disabled = false;
    btnUpload.innerHTML = '<i class="bi bi-rocket-takeoff-fill"></i> Phân tích CV ngay';
    showUploadMsg(
      "Lỗi: " + (err.message || "Không thể kết nối server"),
      "error",
    );
  }
}
// ── Reset về trạng thái ban đầu ──────────────
function resetUpload() {
  selectedFile = null;
  document.getElementById("cvInput").value = "";
  document.getElementById("filePreview").style.display = "none";
  document.getElementById("uploadBox").style.display = "block";
  document.getElementById("uploadStatus").style.display = "none";
  document.getElementById("btnUpload").disabled = false;
  document.getElementById("btnUpload").innerHTML = '<i class="bi bi-rocket-takeoff-fill"></i> Phân tích CV ngay';
  hideUploadMsg();
}

// ── Tiện ích ──────────────────────────────────
function showUploadMsg(text, type) {
  const el = document.getElementById("uploadMsg");
  el.textContent = text;
  el.className = `upload-msg ${type}`;
  el.style.display = "block";
}

function hideUploadMsg() {
  const el = document.getElementById("uploadMsg");
  el.style.display = "none";
  el.className = "upload-msg";
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

# 🎯 JobFit – Hệ thống hỗ trợ tìm kiếm việc làm & đánh giá mức độ phù hợp ứng viên

> Stack: **HTML / CSS / JavaScript** · **Node.js / Express** · **MySQL** · **Groq AI API**

---

## 📋 Mục lục

1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Hướng dẫn cài đặt](#3-hướng-dẫn-cài-đặt)
4. [Cấu hình file .env](#4-cấu-hình-file-env)
5. [Cơ sở dữ liệu MySQL](#5-cơ-sở-dữ-liệu-mysql)
6. [Giải thích các file Backend](#6-giải-thích-các-file-backend)
7. [Giải thích Frontend](#7-giải-thích-frontend)
8. [Danh sách API](#8-danh-sách-api)
9. [Phân công công việc](#9-phân-công-công-việc)

---

## 1. Giới thiệu dự án

JobFit là website hỗ trợ tìm kiếm việc làm, cho phép:

- **Ứng viên** đăng ký tài khoản, tải lên CV (PDF) và nhận kết quả phân tích từ AI
- **Nhà tuyển dụng** đăng tin tuyển dụng với mô tả JD và kỹ năng yêu cầu
- **AI (Groq)** tự động trích xuất thông tin từ CV: tên, kỹ năng, kinh nghiệm, học vấn
- Ứng viên muốn ứng tuyển tự liên hệ qua thông tin hiển thị trong bài đăng của nhà tuyển dụng (không có trung gian qua web)

---

## 2. Cấu trúc thư mục

```
JobFit/
├── backend/
│   ├── config/
│   │   └── db.js                  # Kết nối MySQL (connection pool)
│   ├── controllers/
│   │   ├── auth.controller.js     # Xử lý đăng ký, đăng nhập
│   │   ├── job.controller.js      # Xử lý CRUD tin tuyển dụng
│   │   └── cv.controller.js       # Xử lý upload CV và gọi AI
│   ├── middleware/
│   │   └── auth.middleware.js     # Xác thực JWT token
│   ├── routes/
│   │   ├── auth.routes.js         # Định tuyến /api/auth
│   │   ├── job.routes.js          # Định tuyến /api/jobs
│   │   └── cv.routes.js           # Định tuyến /api/cv
│   ├── uploads/                   # Thư mục lưu file CV (tự tạo)
│   ├── .env                       # Biến môi trường (không commit lên Git)
│   ├── package.json
│   └── server.js                  # Khởi động Express server
│
└── frontend/
    ├── auth.html                  # Trang đăng ký / đăng nhập
    ├── index.html                 # Trang chủ
    ├── search.html                # Tìm kiếm việc làm
    ├── job-detail.html            # Chi tiết việc làm
    ├── upload-cv.html             # Upload CV
    ├── profile.html               # Hồ sơ cá nhân
    ├── employer-dashboard.html    # dashboard nhà tuyển dụng
    ├── payment.html
    ├── post-job.html
    ├── pricing.html
    └── result.html                # Kết quả phân tích AI
```

---

## 3. Hướng dẫn cài đặt

### Yêu cầu hệ thống

| Công cụ        | Phiên bản    | Kiểm tra                                     |
| -------------- | ------------ | -------------------------------------------- |
| Node.js        | v18 trở lên  | `node --version`                             |
| npm            | v9 trở lên   | `npm --version`                              |
| MySQL          | v8.0 trở lên | `mysql --version`                            |
| Tài khoản Groq | Miễn phí     | [console.groq.com](https://console.groq.com) |

---

### Bước 1 – Clone dự án

```bash
git clone <link-repository>
cd JobFit
```

### Bước 2 – Cài package Backend

```bash
cd backend
npm install express mysql2 dotenv bcryptjs jsonwebtoken multer cors groq-sdk pdf2json
```

### Bước 3 – Tạo cơ sở dữ liệu

Mở **MySQL Workbench** hoặc **phpMyAdmin**, chạy file:

```
job_portal.sql
```

File này sẽ tự động tạo database `job_portal`, 4 bảng và dữ liệu mẫu.

### Bước 4 – Cấu hình file .env

Tạo file `.env` trong thư mục `backend/` (xem mục 4).

### Bước 5 – Lấy API key Groq (miễn phí)

1. Vào [https://console.groq.com](https://console.groq.com) → Đăng ký
2. Vào mục **API Keys** → **Create API Key**
3. Copy key và dán vào file `.env`

### Bước 6 – Khởi động server

```bash
node server.js
```

Nếu thành công sẽ hiển thị:

```
Server đang chạy tại http://localhost:3000
```

### Bước 7 – Mở Frontend

Mở thư mục `frontend/`, chuột phải vào `auth.html` → **Open with Live Server** (cần cài extension **Live Server** trong VS Code).

---

## 4. Cấu hình file .env

Tạo file `.env` trong thư mục `backend/`:

```env
# Server
PORT=3000

# Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mat_khau_mysql_cua_ban
DB_NAME=job_portal

# JWT
JWT_SECRET=jobfit_secret_key_2024
JWT_EXPIRES=7d

# Groq AI API
GROQ_API_KEY=GROQ_API_KEY=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
```

> ⚠️ **Lưu ý:** Không được commit file `.env` lên GitHub. File này chứa thông tin bí mật.

---

## 5. Cơ sở dữ liệu MySQL

Hệ thống sử dụng **4 bảng chính**:

### Bảng `users` – Tài khoản người dùng

| Cột          | Kiểu dữ liệu | Mô tả                                        |
| ------------ | ------------ | -------------------------------------------- |
| `id`         | INT (PK)     | Mã định danh tự tăng                         |
| `email`      | VARCHAR(255) | Email đăng nhập, phải duy nhất               |
| `password`   | VARCHAR(255) | Mật khẩu đã mã hóa bcrypt                    |
| `role`       | ENUM         | `candidate` (ứng viên) hoặc `employer` (NTD) |
| `name`       | VARCHAR(150) | Họ tên người dùng                            |
| `created_at` | DATETIME     | Ngày tạo tài khoản                           |

### Bảng `companies` – Thông tin nhà tuyển dụng

| Cột             | Kiểu dữ liệu | Mô tả                                     |
| --------------- | ------------ | ----------------------------------------- |
| `id`            | INT (PK)     | Mã công ty                                |
| `user_id`       | INT (FK)     | Liên kết với bảng `users` (role=employer) |
| `name`          | VARCHAR(255) | Tên công ty                               |
| `contact_email` | VARCHAR(255) | Email liên hệ hiển thị trong bài đăng     |
| `contact_phone` | VARCHAR(20)  | Số điện thoại liên hệ                     |
| `address`       | VARCHAR(500) | Địa chỉ công ty                           |
| `website`       | VARCHAR(500) | Website công ty                           |

### Bảng `jobs` – Tin tuyển dụng

| Cột               | Kiểu dữ liệu | Mô tả                                           |
| ----------------- | ------------ | ----------------------------------------------- |
| `id`              | INT (PK)     | Mã tin tuyển dụng                               |
| `company_id`      | INT (FK)     | Công ty nào đăng tin                            |
| `title`           | VARCHAR(255) | Tên vị trí (VD: Frontend Developer)             |
| `description`     | TEXT         | Mô tả công việc (JD)                            |
| `skills_required` | JSON         | Kỹ năng yêu cầu dạng mảng JSON                  |
| `salary`          | VARCHAR(100) | Mức lương (VD: 15 - 25 triệu)                   |
| `location`        | VARCHAR(255) | Địa điểm làm việc                               |
| `job_type`        | ENUM         | `full-time` / `part-time` / `remote` / `intern` |
| `status`          | ENUM         | `open` (đang mở) hoặc `closed` (đã đóng)        |

### Bảng `cvs` – CV của ứng viên

| Cột           | Kiểu dữ liệu | Mô tả                                               |
| ------------- | ------------ | --------------------------------------------------- |
| `id`          | INT (PK)     | Mã CV                                               |
| `user_id`     | INT (FK)     | CV của ứng viên nào                                 |
| `file_name`   | VARCHAR(255) | Tên file gốc người dùng upload                      |
| `file_path`   | VARCHAR(500) | Đường dẫn lưu trên server (thư mục `uploads/`)      |
| `parsed_data` | JSON         | Dữ liệu AI trích xuất: tên, kỹ năng, kinh nghiệm... |
| `status`      | ENUM         | `pending` / `parsed` / `error`                      |

### Sơ đồ quan hệ

```
users ──────── companies ──── jobs
  │
  └──── cvs  (AI phân tích ở đây)
```

---

## 6. Giải thích các file Backend

### `server.js` – Điểm khởi động

File chính khởi động toàn bộ ứng dụng. Nhiệm vụ:

- Khởi tạo Express app
- Cấu hình middleware: `cors()`, `express.json()`, `express.urlencoded()`
- Khai báo các route: `/api/auth`, `/api/jobs`, `/api/cv`
- Phục vụ file tĩnh từ thư mục `uploads/`
- Lắng nghe kết nối tại PORT trong `.env`

---

### `config/db.js` – Kết nối cơ sở dữ liệu

Tạo **connection pool** đến MySQL. Dùng pool thay vì `createConnection` vì:

- Tự động tái sử dụng kết nối khi có yêu cầu mới
- Xử lý nhiều request đồng thời (tối đa 10 kết nối)
- Tránh lỗi mất kết nối khi server chạy lâu

Các controller khác chỉ cần `require('../config/db')` là có thể truy vấn ngay.

---

### `middleware/auth.middleware.js` – Xác thực JWT

Kiểm tra token trong header `Authorization` trước khi cho phép vào route. Quy trình:

1. Đọc header `Authorization: Bearer <token>`
2. Tách lấy phần token sau chữ `Bearer`
3. Giải mã token bằng `JWT_SECRET` trong `.env`
4. Lưu thông tin user `{ id, role }` vào `req.user` để controller dùng
5. Nếu không có token hoặc sai → trả về `401 Unauthorized`

---

### `controllers/auth.controller.js` – Đăng ký / Đăng nhập

**Hàm `register`:**

1. Lấy `name`, `email`, `password`, `role` từ `req.body`
2. Kiểm tra email đã tồn tại trong DB chưa
3. Mã hóa mật khẩu bằng bcrypt (độ phức tạp: 10)
4. Lưu user mới vào bảng `users`
5. Trả về `201 Created` và `userId`

**Hàm `login`:**

1. Tìm user theo email trong DB
2. So sánh mật khẩu nhập vào với hash bằng `bcrypt.compare`
3. Tạo JWT token chứa `{ id, role }`, hết hạn sau 7 ngày
4. Trả về token + thông tin user (không có password)

---

### `controllers/job.controller.js` – Quản lý tin tuyển dụng

| Hàm          | Mô tả                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `getAllJobs` | Lấy danh sách tất cả job đang `open`, hỗ trợ filter theo `title`, `location`, `job_type` qua query string |
| `getJobById` | Lấy chi tiết 1 job kèm thông tin công ty (JOIN companies)                                                 |
| `createJob`  | Chỉ employer đã đăng nhập mới tạo được. Tự động lấy `company_id` từ user hiện tại                         |
| `deleteJob`  | Kiểm tra job phải thuộc công ty của user trước khi xóa                                                    |

---

### `controllers/cv.controller.js` – Upload CV và AI

**Hàm `extractTextFromPDF`:**

- Dùng thư viện `pdf2json` đọc nội dung text từ file PDF
- Giải mã URL encoding các ký tự đặc biệt
- Ghép text tất cả các trang lại thành 1 chuỗi

**Hàm `analyzeCVWithAI`:**

- Gửi nội dung CV đến Groq API (model `llama-3.3-70b-versatile`)
- Prompt yêu cầu AI trả về JSON với các trường: `name`, `email`, `phone`, `skills`, `experience`, `education`, `summary`
- Xử lý kết quả: xóa markdown code block, parse JSON

**Hàm `uploadCV`:**

1. Kiểm tra có file không (multer xử lý upload)
2. Lưu record vào bảng `cvs` với `status=pending`
3. Gọi `extractTextFromPDF` lấy nội dung
4. Gọi `analyzeCVWithAI` gửi Groq phân tích
5. Cập nhật `parsed_data` và `status=parsed` vào DB
6. Trả về kết quả phân tích cho Frontend

---

## 7. Giải thích Frontend

### `auth.html` – Đăng ký / Đăng nhập

- Giao diện 2 tab: **Đăng nhập** / **Đăng ký**
- Validate form trước khi gửi request
- Sau khi đăng nhập thành công: lưu `token` và `user` vào `localStorage`
- Tự động chuyển hướng: `employer` → `dashboard.html`, `candidate` → `index.html`
- Bấm **Enter** để submit form

### Các trang còn lại

| File              | Chức năng                                                             |
| ----------------- | --------------------------------------------------------------------- |
| `index.html`      | Trang chủ, banner, danh sách việc làm nổi bật, tìm kiếm nhanh         |
| `search.html`     | Tìm kiếm việc làm, lọc theo ngành/lương/địa điểm, phân trang          |
| `job-detail.html` | Chi tiết việc làm, mô tả JD, kỹ năng yêu cầu, thông tin liên hệ NTD   |
| `upload-cv.html`  | Upload file PDF, hiển thị kết quả AI phân tích                        |
| `profile.html`    | Chỉnh sửa hồ sơ cá nhân, kỹ năng, kinh nghiệm                         |
| `result.html`     | Hiển thị kết quả đánh giá: tên, kỹ năng, kinh nghiệm trích xuất từ CV |

### File dùng chung

| File       | Mô tả                                                 |
| ---------- | ----------------------------------------------------- |
| `main.css` | CSS chung cho toàn bộ trang                           |
| `api.js`   | Wrapper gọi fetch đến Backend, tự động đính kèm token |
| `auth.js`  | Kiểm tra đăng nhập, lấy token từ localStorage         |
| `utils.js` | Các hàm tiện ích dùng chung                           |

---

## 8. Danh sách API

Base URL: `http://localhost:3000`

| Method | Endpoint             | Xác thực       | Mô tả                                                          |
| ------ | -------------------- | -------------- | -------------------------------------------------------------- |
| POST   | `/api/auth/register` | Không          | Đăng ký tài khoản mới                                          |
| POST   | `/api/auth/login`    | Không          | Đăng nhập, nhận JWT token                                      |
| GET    | `/api/jobs`          | Không          | Lấy danh sách việc làm (filter: `?title=&location=&job_type=`) |
| GET    | `/api/jobs/:id`      | Không          | Lấy chi tiết 1 việc làm                                        |
| POST   | `/api/jobs`          | JWT (employer) | Đăng tin tuyển dụng mới                                        |
| DELETE | `/api/jobs/:id`      | JWT (employer) | Xóa tin tuyển dụng                                             |
| POST   | `/api/cv`            | JWT            | Upload CV PDF, AI phân tích trả về JSON                        |
| GET    | `/api/cv`            | JWT            | Lấy danh sách CV của user hiện tại                             |
| DELETE | `/api/cv/:id`        | JWT            | Xóa CV (cả file vật lý)                                        |

**Cách gửi token:**

```
Authorization: Bearer <token>
```

**Ví dụ gọi API từ Frontend:**

```javascript
const res = await fetch("http://localhost:3000/api/jobs", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
const data = await res.json();
```

---

## 9. Phân công công việc

| Thành viên        | Phụ trách                    | Chi tiết                                                               |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------- |
| **Bạn (Backend)** | Toàn bộ Backend              | `server.js`, `db.js`, auth/job/cv controllers, middleware, `.env`, SQL |
| **Thành viên 1**  | Trang chủ & Tìm kiếm         | `index.html`, `search.html`, `job-detail.html`                         |
| **Thành viên 2**  | Upload CV & Hồ sơ            | `auth.html`, `upload-cv.html`, `profile.html`                          |
| **Thành viên 3**  | Kết quả AI & Giao diện chung | `result.html`, `main.css`, `api.js`, `utils.js`                        |
| **Thành viên 4**  | Báo cáo & Kiểm thử           | Viết báo cáo, test chức năng, chỉnh sửa lỗi                            |

---

## 🚀 Lệnh nhanh

```bash
# Cài package
cd backend && npm install

# Chạy server
node server.js

# Chạy với tự động reload (cần cài nodemon)
npm install -g nodemon
nodemon server.js
```

---

_JobFit – Nhóm đồ án 2025_

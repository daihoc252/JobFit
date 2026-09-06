# 🎯 JobFit – Hệ thống hỗ trợ tìm kiếm việc làm & đánh giá mức độ phù hợp ứng viên

> Stack: **HTML / CSS / JavaScript** · **Node.js / Express 5** · **MySQL** · **Groq AI API** · **Google/Facebook OAuth**

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

- **Ứng viên** đăng ký/đăng nhập (email, Google hoặc Facebook), tải lên CV (PDF) và nhận **kết quả chấm điểm CV theo chuẩn ATS** từ AI (điểm từng tiêu chí, nhận xét, gợi ý sửa)
- **Nhà tuyển dụng** khai báo thông tin công ty, đăng tin tuyển dụng với mô tả JD, kỹ năng yêu cầu, quản lý (mở/đóng, xóa) tin qua dashboard riêng
- Tính năng **Premium**: nhà tuyển dụng cần nâng cấp Premium (mô phỏng qua trang thanh toán/bảng giá) mới được đăng/sửa/xóa tin tuyển dụng
- Tài khoản có thể **tự chuyển vai trò** giữa ứng viên ↔ nhà tuyển dụng
- **AI (Groq – model `openai/gpt-oss-120b`)** đọc CV và trả về điểm số theo 3 nhóm tiêu chí (nền tảng cơ bản, đánh giá chuyên sâu, điểm cộng khác biệt) cùng nhận xét/gợi ý cải thiện
- Ứng viên muốn ứng tuyển tự liên hệ qua thông tin hiển thị trong bài đăng của nhà tuyển dụng (không có trung gian qua web)

---

## 2. Cấu trúc thư mục

```
JobFit/
├── backend/
│   ├── config/
│   │   └── db.js                     # Kết nối MySQL (connection pool)
│   ├── controllers/
│   │   ├── auth.controller.js        # Đăng ký, đăng nhập, Google/Facebook OAuth, premium, đổi role
│   │   ├── job.controller.js         # CRUD tin tuyển dụng, đóng/mở tin, tin của tôi
│   │   └── cv.controller.js          # Upload CV, đọc PDF, chấm điểm CV bằng AI
│   ├── middleware/
│   │   └── auth.middleware.js        # verifyToken (JWT) + verifyPremium (employer + premium)
│   ├── routes/
│   │   ├── auth.routes.js            # Định tuyến /api/auth
│   │   ├── job.routes.js             # Định tuyến /api/jobs
│   │   ├── cv.routes.js              # Định tuyến /api/cv
│   │   └── company.routes.js         # Định tuyến /api/company
│   ├── uploads/                      # Thư mục lưu file CV (tự tạo, không commit)
│   ├── .env                          # Biến môi trường (không commit lên Git)
│   ├── JobFit.sql                    # Script tạo database + dữ liệu mẫu
│   ├── package.json
│   └── server.js                     # Khởi động Express server
│
└── FrontEnd/
    ├── assets/
    │   ├── css/                      # 1 file css riêng cho mỗi trang + main.css dùng chung
    │   ├── image/                    # Logo, favicon
    │   └── js/
    │       ├── api.js                # Wrapper gọi fetch đến Backend, tự đính kèm token
    │       ├── auth.js               # Quản lý trạng thái đăng nhập (localStorage)
    │       ├── oauth-config.js       # Client ID Google/Facebook (public, không chứa secret)
    │       └── ...                   # 1 file js riêng cho mỗi trang (xem mục 7)
    └── pages/
        ├── auth.html                 # Đăng nhập / đăng ký (email, Google, Facebook)
        ├── index.html                # Trang chủ
        ├── search.html               # Tìm kiếm việc làm
        ├── job-detail.html           # Chi tiết việc làm
        ├── upload-cv.html            # Upload CV & xem điểm AI
        ├── result.html               # Kết quả chấm điểm CV chi tiết
        ├── profile.html              # Hồ sơ cá nhân, danh sách CV đã nộp
        ├── employer-dashboard.html   # Dashboard quản lý tin của nhà tuyển dụng
        ├── post-job.html             # Đăng tin tuyển dụng mới (yêu cầu Premium)
        ├── pricing.html              # Bảng giá gói Premium
        └── payment.html              # Thanh toán nâng cấp Premium
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
npm install
```

### Bước 3 – Tạo cơ sở dữ liệu

Mở **MySQL Workbench** hoặc **phpMyAdmin**, chạy file:

```
backend/JobFit.sql
```

File này sẽ tự động tạo database `JobFit`, 4 bảng (`users`, `companies`, `jobs`, `cvs`) và dữ liệu mẫu.

### Bước 4 – Cấu hình file .env

Tạo file `.env` trong thư mục `backend/` (xem mục 4).

### Bước 5 – Lấy API key Groq (miễn phí)

1. Vào [https://console.groq.com](https://console.groq.com) → Đăng ký
2. Vào mục **API Keys** → **Create API Key**
3. Copy key và dán vào file `.env`

### Bước 6 – (Tuỳ chọn) Cấu hình đăng nhập Google/Facebook

- Google: tạo OAuth Client ID tại [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Facebook: tạo App tại [Meta for Developers](https://developers.facebook.com/apps)
- Điền `GOOGLE_CLIENT_ID` vào `.env`, đồng thời cập nhật `GOOGLE_CLIENT_ID`/`FACEBOOK_APP_ID` trong `FrontEnd/assets/js/oauth-config.js`

### Bước 7 – Khởi động server

```bash
node server.js
# hoặc chạy với tự động reload:
npm run dev
```

Nếu thành công sẽ hiển thị:

```
Server đang chạy tại http://localhost:3000
```

### Bước 8 – Mở Frontend

Mở thư mục `FrontEnd/pages/`, chuột phải vào `auth.html` → **Open with Live Server** (cần cài extension **Live Server** trong VS Code).

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
DB_NAME=JobFit

# JWT
JWT_SECRET=chuoi_bi_mat_tu_dat_cang_ngau_nhien_cang_tot
JWT_EXPIRES=7d

# Groq AI API
GROQ_API_KEY=lay_tai_console.groq.com

# OAuth - Đăng nhập Google/Facebook
GOOGLE_CLIENT_ID=lay_tai_Google_Cloud_Console
FACEBOOK_APP_ID=lay_tai_Meta_for_Developers
FACEBOOK_APP_SECRET=lay_tai_Meta_for_Developers_KHONG_CHIA_SE
```

> ⚠️ **Lưu ý:** Không được commit file `.env` lên GitHub. File này chứa thông tin bí mật.

---

## 5. Cơ sở dữ liệu MySQL

Hệ thống sử dụng **4 bảng chính** (định nghĩa đầy đủ trong `backend/JobFit.sql`):

### Bảng `users` – Tài khoản người dùng

| Cột                  | Kiểu dữ liệu | Mô tả                                                  |
| -------------------- | ------------ | ------------------------------------------------------ |
| `id`                 | INT (PK)     | Mã định danh tự tăng                                   |
| `email`              | VARCHAR(255) | Email đăng nhập, phải duy nhất                         |
| `password`           | VARCHAR(255) | Mật khẩu đã mã hóa bcrypt (`NULL` nếu login qua OAuth) |
| `role`               | ENUM         | `candidate` (ứng viên) hoặc `employer` (NTD)           |
| `provider`           | ENUM         | `local` / `google` / `facebook`                        |
| `provider_id`        | VARCHAR(255) | id (`sub`) trả về từ Google/Facebook                   |
| `name`               | VARCHAR(150) | Họ tên người dùng                                      |
| `avatar`             | VARCHAR(500) | Ảnh đại diện                                           |
| `is_premium`         | BOOLEAN      | Nhà tuyển dụng đã nâng cấp Premium hay chưa            |
| `premium_expires_at` | DATETIME     | Ngày hết hạn Premium                                   |
| `created_at`         | DATETIME     | Ngày tạo tài khoản                                     |

### Bảng `companies` – Thông tin nhà tuyển dụng

| Cột             | Kiểu dữ liệu | Mô tả                                             |
| --------------- | ------------ | ------------------------------------------------- |
| `id`            | INT (PK)     | Mã công ty                                        |
| `user_id`       | INT (FK)     | Liên kết với bảng `users` (role=employer), unique |
| `name`          | VARCHAR(255) | Tên công ty                                       |
| `logo`          | VARCHAR(500) | Logo công ty                                      |
| `description`   | TEXT         | Mô tả công ty                                     |
| `contact_email` | VARCHAR(255) | Email liên hệ hiển thị trong bài đăng             |
| `contact_phone` | VARCHAR(20)  | Số điện thoại liên hệ                             |
| `address`       | VARCHAR(500) | Địa chỉ công ty                                   |
| `website`       | VARCHAR(500) | Website công ty                                   |

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

| Cột           | Kiểu dữ liệu | Mô tả                                                     |
| ------------- | ------------ | --------------------------------------------------------- |
| `id`          | INT (PK)     | Mã CV                                                     |
| `user_id`     | INT (FK)     | CV của ứng viên nào                                       |
| `file_name`   | VARCHAR(255) | Tên file gốc người dùng upload                            |
| `file_path`   | VARCHAR(500) | Đường dẫn lưu trên server (thư mục `uploads/`)            |
| `parsed_data` | JSON         | Kết quả chấm điểm AI: điểm theo tiêu chí, nhận xét, gợi ý |
| `status`      | ENUM         | `pending` / `parsed` / `error`                            |

### Sơ đồ quan hệ

```
users ──────── companies ──── jobs
  │
  └──── cvs  (AI chấm điểm ở đây)
```

---

## 6. Giải thích các file Backend

### `server.js` – Điểm khởi động

File chính khởi động toàn bộ ứng dụng. Nhiệm vụ:

- Khởi tạo Express app
- Cấu hình middleware: `cors()`, `express.json()`, `express.urlencoded()`
- Khai báo các route: `/api/auth`, `/api/jobs`, `/api/cv`, `/api/company`
- Phục vụ file tĩnh từ thư mục `uploads/`
- Lắng nghe kết nối tại PORT trong `.env`

---

### `config/db.js` – Kết nối cơ sở dữ liệu

Tạo **connection pool** đến MySQL. Dùng pool thay vì `createConnection` vì:

- Tự động tái sử dụng kết nối khi có yêu cầu mới
- Xử lý nhiều request đồng thời
- Tránh lỗi mất kết nối khi server chạy lâu

Các controller khác chỉ cần `require('../config/db')` là có thể truy vấn ngay.

---

### `middleware/auth.middleware.js` – Xác thực & phân quyền

**`verifyToken`** – kiểm tra JWT trong header `Authorization` trước khi cho phép vào route:

1. Đọc header `Authorization: Bearer <token>`
2. Giải mã token bằng `JWT_SECRET` trong `.env`
3. Lưu thông tin user `{ id, role }` vào `req.user`
4. Nếu không có token hoặc sai → trả về `401 Unauthorized`

**`verifyPremium`** – dùng thêm cho các route đăng/sửa/xóa tin: kiểm tra user là `employer` và `is_premium = true` (chưa hết hạn), nếu không → `403` kèm `requirePremium: true`.

---

### `controllers/auth.controller.js` – Đăng ký / Đăng nhập / OAuth / Premium

| Hàm              | Mô tả                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `register`       | Kiểm tra email trùng, mã hóa mật khẩu bằng bcrypt, tạo user mới                               |
| `login`          | Tìm user theo email, so khớp mật khẩu bằng `bcrypt.compare`, trả JWT (hạn theo `JWT_EXPIRES`) |
| `googleLogin`    | Xác thực ID token với Google (`google-auth-library`), tìm/tạo user theo `provider_id`         |
| `facebookLogin`  | Xác thực access token qua Graph API debug_token, lấy hồ sơ, tìm/tạo user                      |
| `getMe`          | Trả thông tin user hiện tại kèm trạng thái Premium                                            |
| `upgradePremium` | Mô phỏng thanh toán: đặt `is_premium=true` và tính ngày hết hạn theo gói `monthly`/`yearly`   |
| `changeRole`     | Cho phép user tự đổi vai trò `candidate` ↔ `employer`, cấp lại JWT mới                        |

---

### `controllers/job.controller.js` – Quản lý tin tuyển dụng

| Hàm               | Mô tả                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------- |
| `getAllJobs`      | Lấy danh sách job đang `open`, hỗ trợ filter theo `title`, `location`, `job_type`      |
| `getJobById`      | Lấy chi tiết 1 job kèm thông tin công ty (JOIN companies)                              |
| `createJob`       | Chỉ employer đã đăng nhập + Premium mới tạo được, tự lấy `company_id` từ user hiện tại |
| `deleteJob`       | Kiểm tra job phải thuộc công ty của user trước khi xóa                                 |
| `toggleJobStatus` | Đóng/mở lại tin tuyển dụng (`open` ↔ `closed`)                                         |
| `getMyJobs`       | Lấy danh sách tin của công ty thuộc user hiện tại (dùng cho dashboard)                 |

---

### `controllers/cv.controller.js` – Upload CV và chấm điểm AI

**`extractTextFromPDF`** – dùng `pdf2json` đọc nội dung text từ file PDF, ghép các trang lại thành 1 chuỗi.

**`requestCVAnalysis` / `analyzeCVWithAI`** – gửi nội dung CV đến Groq API (model `openai/gpt-oss-120b`, `response_format: json_object`), yêu cầu chấm điểm CV theo chuẩn ATS trên 3 nhóm tiêu chí (nền tảng cơ bản, đánh giá chuyên sâu, điểm cộng khác biệt); tự động thử lại 1 lần nếu lỗi.

**`normalizeScoreResult`** – tính lại điểm từng category/tổng điểm từ điểm criteria do AI trả về (không tin vào số AI tự cộng), đảm bảo luôn khớp thang điểm.

**`uploadCV`**:

1. Kiểm tra có file không (multer xử lý upload, giới hạn `.pdf`, tối đa 5MB)
2. Lưu record vào bảng `cvs` với `status=pending`
3. Gọi `extractTextFromPDF` lấy nội dung
4. Gọi `analyzeCVWithAI` gửi Groq chấm điểm
5. Cập nhật `parsed_data` và `status=parsed` (hoặc `error` nếu thất bại) vào DB
6. Trả về kết quả chấm điểm cho Frontend

---

### `routes/company.routes.js` – Hồ sơ công ty

`GET /me` lấy thông tin công ty của user hiện tại, `POST /me` tạo mới hoặc cập nhật thông tin công ty (bắt buộc trước khi đăng tin tuyển dụng).

---

## 7. Giải thích Frontend

### `pages/auth.html` – Đăng ký / Đăng nhập

- Giao diện 2 tab: **Đăng nhập** / **Đăng ký**, hỗ trợ thêm đăng nhập bằng **Google** và **Facebook**
- Validate form trước khi gửi request
- Sau khi đăng nhập thành công: lưu `token` và `user` vào `localStorage`
- Tự động chuyển hướng: `employer` → `employer-dashboard.html`, `candidate` → `index.html`

### Các trang còn lại

| File                      | JS tương ứng            | Chức năng                                                            |
| ------------------------- | ----------------------- | -------------------------------------------------------------------- |
| `index.html`              | `index.js`              | Trang chủ, banner, việc làm nổi bật, thống kê                        |
| `search.html`             | `search.js`             | Tìm kiếm việc làm, lọc theo ngành/lương/địa điểm                     |
| `job-detail.html`         | `job-detail.js`         | Chi tiết việc làm, mô tả JD, kỹ năng yêu cầu, thông tin liên hệ NTD  |
| `upload-cv.html`          | `upload-cv.js`          | Upload file PDF, hiển thị trạng thái chấm điểm AI                    |
| `result.html`             | `result.js`             | Hiển thị chi tiết kết quả chấm điểm CV theo từng tiêu chí            |
| `profile.html`            | `profile.js`            | Hồ sơ cá nhân, danh sách CV đã nộp, xóa CV                           |
| `employer-dashboard.html` | `employer-dashboard.js` | Dashboard NTD: danh sách tin đã đăng, đóng/mở/xóa tin                |
| `post-job.html`           | `post-job.js`           | Form đăng tin tuyển dụng mới (yêu cầu công ty đã khai báo + Premium) |
| `pricing.html`            | `pricing.js`            | Bảng giá gói Premium (theo tháng/năm)                                |
| `payment.html`            | `payment.js`            | Trang thanh toán mô phỏng để nâng cấp Premium                        |

### File dùng chung

| File                        | Mô tả                                                                        |
| --------------------------- | ---------------------------------------------------------------------------- |
| `assets/css/main.css`       | CSS chung cho toàn bộ trang, mỗi trang còn có 1 file CSS riêng cùng tên      |
| `assets/js/api.js`          | Wrapper gọi fetch đến Backend (`API_BASE`), tự động đính kèm token           |
| `assets/js/auth.js`         | Lấy/lưu thông tin đăng nhập từ `localStorage`, kiểm tra trạng thái đăng nhập |
| `assets/js/oauth-config.js` | Client ID Google/Facebook dùng ở frontend (public, không chứa secret)        |

---

## 8. Danh sách API

Base URL: `http://localhost:3000`

| Method | Endpoint               | Xác thực                 | Mô tả                                                              |
| ------ | ---------------------- | ------------------------ | ------------------------------------------------------------------ |
| POST   | `/api/auth/register`   | Không                    | Đăng ký tài khoản mới                                              |
| POST   | `/api/auth/login`      | Không                    | Đăng nhập bằng email/mật khẩu, nhận JWT token                      |
| POST   | `/api/auth/google`     | Không                    | Đăng nhập/đăng ký bằng Google                                      |
| POST   | `/api/auth/facebook`   | Không                    | Đăng nhập/đăng ký bằng Facebook                                    |
| GET    | `/api/auth/me`         | JWT                      | Lấy thông tin user hiện tại (kèm trạng thái Premium)               |
| POST   | `/api/auth/upgrade`    | JWT                      | Nâng cấp Premium (mô phỏng thanh toán)                             |
| PATCH  | `/api/auth/role`       | JWT                      | Tự đổi vai trò ứng viên ↔ nhà tuyển dụng                           |
| GET    | `/api/jobs`            | Không                    | Danh sách việc làm đang mở (filter: `?title=&location=&job_type=`) |
| GET    | `/api/jobs/my-jobs`    | JWT                      | Danh sách tin của công ty thuộc user hiện tại                      |
| GET    | `/api/jobs/:id`        | Không                    | Chi tiết 1 việc làm                                                |
| POST   | `/api/jobs`            | JWT + Premium (employer) | Đăng tin tuyển dụng mới                                            |
| DELETE | `/api/jobs/:id`        | JWT + Premium (employer) | Xóa tin tuyển dụng                                                 |
| PATCH  | `/api/jobs/:id/status` | JWT + Premium (employer) | Đóng/mở lại tin tuyển dụng                                         |
| GET    | `/api/company/me`      | JWT                      | Lấy thông tin công ty của user hiện tại                            |
| POST   | `/api/company/me`      | JWT                      | Tạo mới hoặc cập nhật thông tin công ty                            |
| POST   | `/api/cv`              | JWT                      | Upload CV PDF, AI chấm điểm trả về JSON                            |
| GET    | `/api/cv`              | JWT                      | Lấy danh sách CV của user hiện tại                                 |
| DELETE | `/api/cv/:id`          | JWT                      | Xóa CV (cả file vật lý)                                            |

**Cách gửi token:**

```
Authorization: Bearer <token>
```

**Ví dụ gọi API từ Frontend:**

```javascript
const res = await fetch("http://127.0.0.1:3000/api/jobs", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
const data = await res.json();
```

---

## 9. Phân công công việc

| Thành viên     | Phụ trách                    | Chi tiết                                                                       |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| **ĐẠI HỌC**    | Toàn bộ Backend              | `server.js`, `db.js`, auth/job/cv/company controllers, middleware, `.env`, SQL |
| **GIA HUY**    | Trang chủ & Tìm kiếm         | `index.html`, `search.html`, `job-detail.html`                                 |
| **QUANG HUY**  | Upload CV & Hồ sơ            | `auth.html`, `upload-cv.html`, `profile.html`                                  |
| **TRỌNG TOÀN** | Kết quả AI & Giao diện chung | `result.html`, `main.css`, `api.js`                                            |
| **GIA KHANG**  | Báo cáo & Kiểm thử           | Viết báo cáo, test chức năng, chỉnh sửa lỗi                                    |

---

## 🚀 Lệnh nhanh

```bash
# Cài package
cd backend && npm install

# Chạy server
node server.js

# Chạy với tự động reload (đã có sẵn nodemon trong devDependencies)
npm run dev
```

---

_JobFit – Nhóm đồ án 2025_

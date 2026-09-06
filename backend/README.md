# JobFit

Đánh giá độ phù hợp công việc.

# Link clone git

https://github.com/daihoc252/JobFit.git

# Set Up BackEnd khi clone code từ Git

cd backend
npm init -y
npm install express mysql2 dotenv bcryptjs jsonwebtoken multer cors
npm i -D nodemon
npm install @google/generative-ai pdf-parse

-- Tạo lại file .env

# Server

PORT=3000

# Database

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<mật khẩu MySQL của bạn>
DB_NAME=jobfit

# JWT

JWT_SECRET=<chuỗi bí mật tự đặt, càng dài càng ngẫu nhiên càng tốt>
JWT_EXPIRES=7d

# API Keys AI

GEMINI_API_KEY=<lấy tại Google AI Studio>
GROQ_API_KEY=<lấy tại console.groq.com>

# OAuth - Đăng nhập Google/Facebook

GOOGLE_CLIENT_ID=<lấy tại Google Cloud Console>
FACEBOOK_APP_ID=<lấy tại Meta for Developers>
FACEBOOK_APP_SECRET=<lấy tại Meta for Developers — KHÔNG chia sẻ giá trị này>

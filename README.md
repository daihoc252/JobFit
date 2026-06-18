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
DB_PASSWORD=
DB_NAME=jobfit

# JWT

JWT_SECRET=jobfit_secret_key_2024
JWT_EXPIRES=7d

# API Keys AI

GEMINI_API_KEY=AQ.Ab8RN6KccwLqwF\_\_weNKXiRzKTLzKH8w6Q09wgLVH7Evyh9Nsg
GROQ_API_KEY=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

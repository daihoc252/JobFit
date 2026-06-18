const mysql = require("mysql2");
require("dotenv").config();

// Tạo "pool" kết nối thay vì kết nối đơn lẻ
// Pool giúp tái sử dụng kết nối, hiệu quả hơn
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Tối đa 10 kết nối cùng lúc
});

// Chuyển pool sang dạng hỗ trợ async/await cho dễ dùng
const db = pool.promise();

module.exports = db;

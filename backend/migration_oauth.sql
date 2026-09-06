-- =============================================
-- MIGRATION: Đăng nhập qua Google / Facebook
-- Chạy file này trên database JobFit đã có sẵn dữ liệu
-- (JobFit.sql chỉ dùng cho lần cài đặt đầu tiên, không tự chạy lại)
-- =============================================

USE JobFit;

-- Cho phép tài khoản đăng nhập bằng Google/Facebook không cần mật khẩu
ALTER TABLE users MODIFY password VARCHAR(255) NULL;

-- Đánh dấu tài khoản được tạo bằng phương thức nào
ALTER TABLE users
  ADD COLUMN provider    ENUM('local', 'google', 'facebook') NOT NULL DEFAULT 'local' AFTER role,
  ADD COLUMN provider_id VARCHAR(255) DEFAULT NULL AFTER provider;

CREATE INDEX idx_users_provider ON users(provider, provider_id);

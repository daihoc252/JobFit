-- =============================================
-- DATABASE: Job Fit - Hệ thống tìm kiếm việc làm
-- =============================================

CREATE DATABASE IF NOT EXISTS JobFit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE JobFit;

-- =============================================
-- BẢNG 1: users - Tài khoản người dùng
-- =============================================
CREATE TABLE users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('candidate', 'employer') NOT NULL DEFAULT 'candidate',
  name        VARCHAR(150) NOT NULL,
  avatar      VARCHAR(500) DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- BẢNG 2: companies - Thông tin nhà tuyển dụng
-- =============================================
CREATE TABLE companies (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  user_id         INT          NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  logo            VARCHAR(500) DEFAULT NULL,
  description     TEXT         DEFAULT NULL,
  address         VARCHAR(500) DEFAULT NULL,
  contact_email   VARCHAR(255) NOT NULL,
  contact_phone   VARCHAR(20)  DEFAULT NULL,
  website         VARCHAR(500) DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_companies_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- =============================================
-- BẢNG 3: jobs - Tin tuyển dụng
-- =============================================
CREATE TABLE jobs (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  company_id       INT          NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT         NOT NULL,
  skills_required  JSON         DEFAULT NULL,   -- VD: ["React", "Node.js", "MySQL"]
  salary           VARCHAR(100) DEFAULT NULL,   -- VD: "10 - 20 triệu"
  location         VARCHAR(255) DEFAULT NULL,
  job_type         ENUM('full-time', 'part-time', 'remote', 'intern') DEFAULT 'full-time',
  status           ENUM('open', 'closed')       NOT NULL DEFAULT 'open',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_jobs_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE
);

-- =============================================
-- BẢNG 4: cvs - CV của ứng viên
-- =============================================
CREATE TABLE cvs (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT          NOT NULL,
  file_name    VARCHAR(255) NOT NULL,           -- Tên file gốc
  file_path    VARCHAR(500) NOT NULL,           -- Đường dẫn lưu trên server
  parsed_data  JSON         DEFAULT NULL,       -- Dữ liệu AI trích xuất
                                                -- VD: { "skills": ["React", "JS"],
                                                --       "experience": "2 năm",
                                                --       "education": "Đại học" }
  status       ENUM('pending', 'parsed', 'error') NOT NULL DEFAULT 'pending',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_cvs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- =============================================
-- INDEX - Tăng tốc truy vấn
-- =============================================
CREATE INDEX idx_jobs_company   ON jobs(company_id);
CREATE INDEX idx_jobs_status    ON jobs(status);
CREATE INDEX idx_jobs_location  ON jobs(location);
CREATE INDEX idx_cvs_user       ON cvs(user_id);
CREATE INDEX idx_cvs_status     ON cvs(status);

-- =============================================
-- DỮ LIỆU MẪU (Sample Data)
-- =============================================

-- Tài khoản mẫu (password: "123456" đã hash bcrypt)
INSERT INTO users (email, password, role, name) VALUES
('candidate1@gmail.com', '$2b$10$examplehashforcandidate1xxxxx', 'candidate', 'Nguyễn Văn An'),
('candidate2@gmail.com', '$2b$10$examplehashforcandidate2xxxxx', 'candidate', 'Trần Thị Bình'),
('employer1@gmail.com',  '$2b$10$examplehashforemployer1xxxxx',  'employer',  'Lê Văn Cường');

-- Công ty mẫu
INSERT INTO companies (user_id, name, logo, description, address, contact_email, contact_phone, website) VALUES
(3, 'FPT Software', NULL,
 'Công ty công nghệ hàng đầu Việt Nam, chuyên gia công phần mềm cho thị trường quốc tế.',
 'Tòa nhà FPT, Đường Duy Tân, Hà Nội',
 'tuyendung@fpt.com.vn', '024 7300 7300', 'https://fptsoftware.com');

-- Tin tuyển dụng mẫu
INSERT INTO jobs (company_id, title, description, skills_required, salary, location, job_type, status) VALUES
(1,
 'Frontend Developer',
 'Chúng tôi tìm kiếm Frontend Developer có kinh nghiệm xây dựng giao diện web hiện đại. Yêu cầu làm việc nhóm tốt, chủ động và có tinh thần học hỏi.',
 '["HTML", "CSS", "JavaScript", "ReactJS", "Git"]',
 '15 - 25 triệu',
 'Hồ Chí Minh',
 'full-time',
 'open'),

(1,
 'Backend Developer (Node.js)',
 'Tuyển Backend Developer thành thạo Node.js, có kinh nghiệm thiết kế REST API và làm việc với cơ sở dữ liệu quan hệ.',
 '["Node.js", "Express", "MySQL", "REST API", "Git"]',
 '18 - 30 triệu',
 'Hà Nội',
 'full-time',
 'open'),

(1,
 'Thực tập sinh IT',
 'Cơ hội thực tập tại môi trường chuyên nghiệp, được mentor hướng dẫn trực tiếp. Phù hợp sinh viên năm 3-4 ngành CNTT.',
 '["HTML", "CSS", "JavaScript"]',
 '3 - 5 triệu',
 'Hồ Chí Minh',
 'intern',
 'open');


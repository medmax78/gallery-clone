-- Run this once on your local MySQL to create the database, user and tables.
-- Usage: mysql -u root -p < db/init.sql

-- 1. Create database and user
CREATE DATABASE IF NOT EXISTS gallery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gallery_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gallery_db.* TO 'gallery_user'@'localhost';
FLUSH PRIVILEGES;

USE gallery_db;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS vessels (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  thumbnail   TEXT         NOT NULL DEFAULT '/vessel-container.png',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dishes (
  id          VARCHAR(32)    NOT NULL PRIMARY KEY,
  vessel_id   VARCHAR(32)    NOT NULL,
  image       TEXT           NOT NULL,
  date        DATETIME       NOT NULL,
  rating      DECIMAL(4,2)   NOT NULL DEFAULT 0,
  votes       INT            NOT NULL DEFAULT 0,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vessel_id (vessel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_credentials (
  id          INT          NOT NULL PRIMARY KEY DEFAULT 1,
  username    VARCHAR(255) NOT NULL DEFAULT 'max',
  password    VARCHAR(255) NOT NULL DEFAULT '1234567890',
  CONSTRAINT single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Seed default admin credentials
INSERT INTO admin_credentials (id, username, password)
VALUES (1, 'max', '1234567890')
ON DUPLICATE KEY UPDATE id = id;

-- 4. Seed default vessels
INSERT INTO vessels (id, name) VALUES
  ('v-0',  'mv Powan'),
  ('v-1',  'mv Kaying'),
  ('v-2',  'mv Poyang'),
  ('v-3',  'mv Pakhoi'),
  ('v-4',  'mv Pekin'),
  ('v-5',  'mv Moana Chief'),
  ('v-6',  'mv Luenho'),
  ('v-7',  'mv Hoihow'),
  ('v-8',  'mv Hanyang'),
  ('v-9',  'mv Fuchow'),
  ('v-10', 'mv Lintan')
ON DUPLICATE KEY UPDATE id = id;

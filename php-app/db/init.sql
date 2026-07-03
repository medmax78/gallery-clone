-- ============================================================
-- Swire Bulk Gallery (PHP version) – MySQL init script
-- Run once as root:  sudo mysql < db/init.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS gallerydb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gallerydb;

CREATE TABLE IF NOT EXISTS vessels (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  thumbnail   TEXT         NOT NULL DEFAULT '/public/vessel-container.png',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dishes (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  vessel_id   VARCHAR(32)  NOT NULL,
  image       TEXT         NOT NULL,
  date        DATETIME     NOT NULL,
  rating      DECIMAL(4,2) NOT NULL DEFAULT 0,
  votes       INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vessel_id (vessel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_credentials (
  id          INT          NOT NULL PRIMARY KEY DEFAULT 1,
  username    VARCHAR(255) NOT NULL DEFAULT 'max',
  password    VARCHAR(255) NOT NULL DEFAULT '1234567890'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO admin_credentials (id, username, password)
VALUES (1, 'max', '1234567890')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO vessels (id, name, thumbnail) VALUES
  ('v-0',  'mv Powan',       '/public/vessels/default.jpg'),
  ('v-1',  'mv Kaying',      '/public/vessels/default.jpg'),
  ('v-2',  'mv Poyang',      '/public/vessels/default.jpg'),
  ('v-3',  'mv Pakhoi',      '/public/vessels/default.jpg'),
  ('v-4',  'mv Pekin',       '/public/vessels/default.jpg'),
  ('v-5',  'mv Moana Chief', '/public/vessels/default.jpg'),
  ('v-6',  'mv Luenho',      '/public/vessels/default.jpg'),
  ('v-7',  'mv Hoihow',      '/public/vessels/default.jpg'),
  ('v-8',  'mv Hanyang',     '/public/vessels/default.jpg'),
  ('v-9',  'mv Fuchow',      '/public/vessels/default.jpg'),
  ('v-10', 'mv Lintan',      '/public/vessels/default.jpg')
ON DUPLICATE KEY UPDATE id = id;

CREATE USER IF NOT EXISTS 'galleryuser'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON gallerydb.* TO 'galleryuser'@'localhost';
FLUSH PRIVILEGES;

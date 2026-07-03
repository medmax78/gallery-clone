<?php
// ─── Database configuration ──────────────────────────────────────────────────
// Copy config/db.example.php to config/db.php and fill in your credentials.

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'gallerydb');
define('DB_USER', 'galleryuser');
define('DB_PASS', 'YourStrongPassword123!');
define('DB_CHARSET', 'utf8mb4');

// ─── Shared PDO instance ──────────────────────────────────────────────────────
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST, DB_PORT, DB_NAME, DB_CHARSET);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

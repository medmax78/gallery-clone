<?php
session_start();
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

// Must be logged in admin
if (empty($_SESSION['admin'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file        = $_FILES['file'];
$vesselName  = trim($_POST['vesselName'] ?? '');
$isThumbnail = !empty($_POST['isThumbnail']);
$vesselId    = trim($_POST['vesselId']   ?? '');
$date        = trim($_POST['date']       ?? '');

if (!$vesselName) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing vessel name']);
    exit;
}

// Validate file type
$allowed = ['image/jpeg','image/png','image/gif','image/webp'];
$finfo   = finfo_open(FILEINFO_MIME_TYPE);
$mime    = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type']);
    exit;
}

// Build safe directory name from vessel name
$safeName = preg_replace('/[^a-z0-9-]/', '-', strtolower($vesselName));
$safeName = trim(preg_replace('/-+/', '-', $safeName), '-');

$dir = __DIR__ . '/../public/vessels/' . $safeName;
if (!is_dir($dir)) mkdir($dir, 0775, true);

// Unique filename
$ext      = ['image/jpeg'=>'jpg','image/png'=>'png','image/gif'=>'gif','image/webp'=>'webp'][$mime];
$filename = bin2hex(random_bytes(8)) . '.' . $ext;
$destPath = $dir . '/' . $filename;
$webPath  = '/public/vessels/' . $safeName . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit;
}

// ── Thumbnail update ──────────────────────────────────────────────────────────
if ($isThumbnail && $vesselId) {
    db()->prepare("UPDATE vessels SET thumbnail=? WHERE id=?")
        ->execute([$webPath, $vesselId]);
    echo json_encode(['ok' => true, 'path' => $webPath]);
    exit;
}

// ── Dish insert ───────────────────────────────────────────────────────────────
// Lookup vessel by name
$vessel = db()->prepare("SELECT id FROM vessels WHERE name=?");
$vessel->execute([$vesselName]);
$vesselRow = $vessel->fetch();

if (!$vesselRow) {
    http_response_code(400);
    echo json_encode(['error' => 'Vessel not found']);
    exit;
}

// Resolve date
$dateVal = $date ? date('Y-m-d H:i:s', strtotime($date)) : date('Y-m-d H:i:s');

$dishId = 'd-' . bin2hex(random_bytes(6));
db()->prepare("INSERT INTO dishes (id, vessel_id, image, date, rating, votes) VALUES (?,?,?,?,0,0)")
    ->execute([$dishId, $vesselRow['id'], $webPath, $dateVal]);

echo json_encode(['ok' => true, 'path' => $webPath, 'id' => $dishId]);

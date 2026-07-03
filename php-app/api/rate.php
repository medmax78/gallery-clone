<?php
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body   = json_decode(file_get_contents('php://input'), true);
$dishId = trim($body['dish_id'] ?? '');
$rating = (int)($body['rating'] ?? 0);

if (!$dishId || $rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Atomic rolling average update
db()->prepare("
    UPDATE dishes
    SET rating = ((rating * votes) + ?) / (votes + 1),
        votes  = votes + 1
    WHERE id = ?
")->execute([$rating, $dishId]);

$row = db()->prepare("SELECT rating, votes FROM dishes WHERE id=?");
$row->execute([$dishId]);
$dish = $row->fetch();

echo json_encode([
    'ok'     => true,
    'rating' => round((float)$dish['rating'], 2),
    'votes'  => (int)$dish['votes'],
]);

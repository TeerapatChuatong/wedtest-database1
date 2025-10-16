<?php
require_once __DIR__ . '/session_boot.php';
require_admin(); // ต้องเป็นแอดมิน

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = $body['user_id'] ?? null;
$new    = trim($body['new_password'] ?? '');

if (!$userId || $new === '') {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'missing_fields']);
  exit;
}
if (strlen($new) < 8) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'weak_password']);
  exit;
}

require_once __DIR__ . '/../db.php';

$stmt = $dbh->prepare("SELECT id FROM user WHERE id = ?");
$stmt->execute([$userId]);
if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
  http_response_code(404);
  echo json_encode(['status' => 'error', 'message' => 'user_not_found']);
  exit;
}

$newHash = password_hash($new, PASSWORD_BCRYPT);
$upd = $dbh->prepare("UPDATE user SET password_hash = ? WHERE id = ?");
$upd->execute([$newHash, $userId]);

echo json_encode(['status' => 'ok']);

<?php
require_once __DIR__ . '/session_boot.php'; // มี require_login() ข้างใน
require_login();

// รับ JSON
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$current = trim($body['current_password'] ?? '');
$new     = trim($body['new_password'] ?? '');

// ตรวจฟอร์ม
if ($current === '' || $new === '') {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'missing_fields']);
  exit;
}
// ตัวอย่าง policy ง่าย ๆ (ปรับตามต้องการ)
if (strlen($new) < 8) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'weak_password']);
  exit;
}

// ดึง user ปัจจุบัน
$user = $_SESSION['user'] ?? null;
$userId = $user['id'] ?? null;

require_once __DIR__ . '/../db.php';

$stmt = $dbh->prepare("SELECT id, password_hash FROM user WHERE id = ?");
$stmt->execute([$userId]);
$u = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$u || !password_verify($current, $u['password_hash'])) {
  http_response_code(401);
  echo json_encode(['status' => 'error', 'message' => 'invalid_current_password']);
  exit;
}

// hash ใหม่และอัปเดต
$newHash = password_hash($new, PASSWORD_BCRYPT);
$upd = $dbh->prepare("UPDATE user SET password_hash = ? WHERE id = ?");
$upd->execute([$newHash, $userId]);

echo json_encode(['status' => 'ok']);

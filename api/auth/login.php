<?php
require_once __DIR__ . '/../users/../db.php';
require_once __DIR__ . '/session_boot.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error']); exit; }

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';

if (!$email || !$password) { echo json_encode(['status'=>'error']); exit; }

try {
  $stm = $dbh->prepare("SELECT id,fname,lname,email,password_hash,avatar,role FROM user WHERE email = ?");
  $stm->execute([$email]);
  $u = $stm->fetch(PDO::FETCH_ASSOC);

  if (!$u || !password_verify($password, $u['password_hash'])) {
    http_response_code(401); echo json_encode(['status'=>'error','message'=>'invalid_credentials']); exit;
  }

  $_SESSION['user'] = ['id'=>$u['id'],'fname'=>$u['fname'],'lname'=>$u['lname'],'email'=>$u['email'],'role'=>$u['role'],'avatar'=>$u['avatar']];
  echo json_encode(['status'=>'ok','user'=>$_SESSION['user']]);
} catch (Throwable $e) {
  http_response_code(500); echo json_encode(['status'=>'error']);
}

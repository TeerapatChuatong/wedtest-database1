<?php
require_once __DIR__ . '/../users/../db.php';
require_once __DIR__ . '/session_boot.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error']); exit; }

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$fname  = trim($input['fname'] ?? '');
$lname  = trim($input['lname'] ?? '');
$email  = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';
$avatar = trim($input['avatar'] ?? '');

if (!$fname || !$lname || !$email || !$password) { echo json_encode(['status'=>'error','message'=>'missing']); exit; }

try {
  // $dbh = PDO from db.php
  // เช็คอีเมลซ้ำ
  $stm = $dbh->prepare("SELECT id FROM user WHERE email = ?");
  $stm->execute([$email]);
  if ($stm->fetch()) { echo json_encode(['status'=>'error','message'=>'email_exists']); exit; }

  $hash = password_hash($password, PASSWORD_DEFAULT);
  $stm = $dbh->prepare("INSERT INTO user (fname,lname,email,password_hash,avatar,role) VALUES (?,?,?,?,?,?)");
  $ok = $stm->execute([$fname,$lname,$email,$hash,$avatar,'user']);
  if (!$ok) { echo json_encode(['status'=>'error']); exit; }

  $id = $dbh->lastInsertId();
  $_SESSION['user'] = ['id'=>$id,'fname'=>$fname,'lname'=>$lname,'email'=>$email,'role'=>'user','avatar'=>$avatar];

  echo json_encode(['status'=>'ok','user'=>$_SESSION['user']]);
} catch (Throwable $e) {
  http_response_code(500); echo json_encode(['status'=>'error']);
}

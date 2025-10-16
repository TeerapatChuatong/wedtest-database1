<?php
// api/auth/session_boot.php
session_start();

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// helper
function current_user() { return $_SESSION['user'] ?? null; }
function require_login() {
  if (!isset($_SESSION['user'])) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'unauthorized']); exit; }
}
function require_admin() {
  require_login();
  if (($_SESSION['user']['role'] ?? 'user') !== 'admin') { http_response_code(403); echo json_encode(['status'=>'error','message'=>'forbidden']); exit; }
}

<?php
require_once __DIR__ . '/session_boot.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error']); exit; }
$_SESSION = [];
session_destroy();
echo json_encode(['status'=>'ok']);

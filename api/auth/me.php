<?php
require_once __DIR__ . '/session_boot.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['status'=>'error']); exit; }
echo json_encode(['status'=>'ok','user'=>current_user()]);

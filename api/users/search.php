<?php
// เพิ่มส่วนนี้ที่บรรทัดแรกสุดของทุกไฟล์ PHP API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// จัดการ preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Content-type: application/json; charset=utf-8");
include('../db.php');

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(array('status' => 'error'));
    die(); 
}

try {
    // รับ id ได้ทั้งจาก JSON และจาก query string
    $id = null;
    if (isset($data->id) && $data->id !== '') {
        $id = trim($data->id);
    } elseif (isset($_GET['id']) && $_GET['id'] !== '') {
        $id = trim($_GET['id']);
    }

    if ($id !== null) {
        // ค้นหาตาม id
        $stmt = $dbh->prepare("SELECT id, fname, lname, avatar FROM user WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            echo json_encode(['status' => 'ok', 'data' => $row]);
        } else {
            // ไม่พบ id นี้
            echo json_encode(['status' => 'ok', 'message' => 'No memberID', 'data' => null]);
        }
    } else {
        // ไม่ระบุ id → ดึงทั้งหมด
        $stmt = $dbh->prepare("SELECT id, fname, lname, avatar FROM user ORDER BY id DESC");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $dbh = null;
    }catch(PDOException $e) {
    print "Error!: " . $e->getMessage() . "<br/>";
    die();
}
?>

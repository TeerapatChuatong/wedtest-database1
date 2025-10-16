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

if ($_SERVER["REQUEST_METHOD"] !== "PATCH") {
    echo json_encode(array('status' => 'error'));
    die(); 
}

try {
    $stmt = $dbh->prepare("UPDATE user SET fname = ?, lname = ?, email = ?, avatar = ? WHERE id = ?");
    $stmt->bindParam(1, $data ->fname);
    $stmt->bindParam(2, $data ->lname);
    $stmt->bindParam(3, $data ->email);
    $stmt->bindParam(4, $data ->avatar);
    $stmt->bindParam(5, $data ->id);

    if ($stmt->execute()) {
        echo json_encode(array('status' => 'ok'));
    } else {
        echo json_encode(array('status'=> 'error'));
    }

    $dbh = null;
    }catch(PDOException $e) {
    print "Error!: " . $e->getMessage() . "<br/>";
    die();
}
?>

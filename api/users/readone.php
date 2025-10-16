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

try {
    $stmt = $dbh->prepare("SELECT * FROM user where id = ?");
    $stmt->execute([$_GET['id']]);
    foreach ($stmt as $row) {
    $user = array(
        'id'     => $row['id'],
        'fname'  => $row['fname'],
        'lname'  => $row['lname'],
        'email'  => $row['email'],
        'avatar' => $row['avatar'],
    );
    echo json_encode($user);
    break;
    }

    $dbh = null;
    }catch(PDOException $e) {
    print "Error!: " . $e->getMessage() . "<br/>";
    die();
}
?>

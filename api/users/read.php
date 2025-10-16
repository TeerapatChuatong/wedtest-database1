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
    $users = array();
    foreach($dbh->query('SELECT * from user') as $row) {
        // print_r($row); // เอาออกเพื่อไม่ให้ปนกับ JSON
        array_push($users, array(
            'id'     => $row['id'],
            'fname'  => $row['fname'],
            'lname'  => $row['lname'],
            'avatar' => $row['avatar'],
        ));
    }
    echo json_encode($users, JSON_UNESCAPED_UNICODE);

    $dbh = null;
}catch(PDOException $e) {
    print "Error!: " . $e->getMessage() . "<br/>";
    die();
}
?>

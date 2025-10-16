<?php
// api/users/search.php

// ---- CORS & JSON ----
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Method guard
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/../db.php'; // ปรับ path ตามจริง

try {
    // สมมติ db.php สร้าง PDO ไว้ใน $dbh
    // $dbh = new PDO(...)

    // รับพารามิเตอร์
    $rawBody  = file_get_contents("php://input");
    $jsonBody = json_decode($rawBody, true);

    $id = null;
    if (isset($jsonBody['id']) && $jsonBody['id'] !== '') {
        $id = trim($jsonBody['id']);
    } elseif (isset($_GET['id']) && $_GET['id'] !== '') {
        $id = trim($_GET['id']);
    }

    $keyword = '';
    if (isset($_GET['keyword'])) {
        $keyword = trim($_GET['keyword']);
    } elseif (isset($jsonBody['keyword'])) {
        $keyword = trim($jsonBody['keyword']);
    }

    // เคส 1: ถ้ามี id และไม่ส่ง keyword → คืนรายการเดียวตาม id
    if ($id !== null && $keyword === '') {
        $stmt = $dbh->prepare("SELECT id, fname, lname, avatar FROM user WHERE id = :id");
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // คืนเป็น array เสมอ เพื่อให้ frontend handle เดียวกัน
        $data = $row ? [$row] : [];
        echo json_encode(['status' => 'ok', 'data' => $data], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // เคส 2: ถ้ามี keyword → ค้นแบบ like (และถ้า keyword เป็นตัวเลข จะลอง match id ตรง ๆ ด้วย)
    if ($keyword !== '') {
        $isNumeric = ctype_digit($keyword);

        $sql = "SELECT id, fname, lname, avatar
                FROM user
                WHERE ";
        $conds = [];
        if ($isNumeric) {
            $conds[] = "id = :id_eq";
        }
        $conds[] = "(fname LIKE :kw OR lname LIKE :kw
                    /* OR email LIKE :kw */)";  // ถ้ามีคอลัมน์ email ให้เอาคอมเมนต์นี้ออก
        $sql .= implode(" OR ", $conds) . " ORDER BY id ASC";

        $stmt = $dbh->prepare($sql);
        if ($isNumeric) {
            $stmt->bindValue(':id_eq', (int)$keyword, PDO::PARAM_INT);
        }
        $like = '%' . $keyword . '%';
        $stmt->bindValue(':kw', $like, PDO::PARAM_STR);

        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'ok', 'data' => $rows], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // เคส 3: ไม่ส่ง id/keyword → คืนทั้งหมด
    $stmt = $dbh->prepare("SELECT id, fname, lname, avatar FROM user ORDER BY id DESC");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'ok', 'data' => $rows], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error',
        // 'debug' => $e->getMessage(), // เปิดเฉพาะตอน dev
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

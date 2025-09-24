<?php
// get_notices.php
header('Content-Type: application/json; charset=utf-8');
// הרשה גישה מה-React dev server
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit; // פרה-פלייט של CORS
}

require_once __DIR__ . '/db.php';
mysqli_set_charset($con, 'utf8mb4');

// --- פרמטרים לחיפוש/דפדוף ---
$page = max(1, (int)($_GET['page'] ?? 1));      // דף
$q    = trim($_GET['q'] ?? '');                 // טקסט חיפוש
$type = trim($_GET['type'] ?? '');              // סוג מודעה
$limit  = 10;
$offset = ($page - 1) * $limit;

// --- בניית WHERE דינמי ---
$where = [];
$params = [];
$types  = '';

if ($q !== '') {
  $where[] = "(title LIKE ? OR description LIKE ? OR location LIKE ?)";
  $like = "%$q%";
  $params[] = $like; $params[] = $like; $params[] = $like;
  $types .= 'sss';
}
if ($type !== '') {
  $where[]  = "type = ?";
  $params[] = $type;
  $types    .= 's';
}
$WHERE_SQL = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

// --- שליפה ---
$sql = "SELECT id,user_id,name,contact,type,title,description,location,trip_dates,created_at
        FROM notices
        $WHERE_SQL
        ORDER BY id DESC
        LIMIT $limit OFFSET $offset";

$stmt = mysqli_prepare($con, $sql);
if (!$stmt) {
  http_response_code(500);
  echo json_encode(["ok"=>false,"error"=>"prepare failed","detail"=>mysqli_error($con)], JSON_UNESCAPED_UNICODE);
  exit;
}
if ($types !== '') {
  mysqli_stmt_bind_param($stmt, $types, ...$params);
}
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

$items = [];
while ($row = mysqli_fetch_assoc($res)) {
  $items[] = $row;
}

echo json_encode(["ok"=>true, "items"=>$items, "page"=>$page], JSON_UNESCAPED_UNICODE);

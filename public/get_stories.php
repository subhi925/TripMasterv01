<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

ini_set('display_errors', 1);
error_reporting(E_ALL);

$user_id = trim($_GET['user_id'] ?? $_POST['user_id'] ?? '');

require __DIR__ . '/db.php';
mysqli_set_charset($con, 'utf8mb4');

$where = [];
if ($user_id !== '') {
  $where[] = "user_id = '" . mysqli_real_escape_string($con, $user_id) . "'";
}

$sql = "SELECT id,user_id,trip_id,title,notes,country,images,rating,start_date,end_date,eventCalender,duration_days,created_at
        FROM stories";
if ($where) $sql .= " WHERE " . implode(" AND ", $where);
$sql .= " ORDER BY id DESC LIMIT 200";

$res = mysqli_query($con, $sql);
if (!$res) { echo json_encode(['ok'=>false,'error'=>mysqli_error($con)]); exit; }

$out = ['ok'=>true, 'items'=>[]];
while ($row = mysqli_fetch_assoc($res)) {
  $out['items'][] = [
    'id'            => (int)$row['id'],
    'user_id'       => $row['user_id'],
    'trip_id'       => $row['trip_id'] !== null ? (int)$row['trip_id'] : null,
    'title'         => $row['title'],
    'notes'         => $row['notes'],
    'country'       => $row['country'],
    'images'        => $row['images'] ? json_decode($row['images'], true) : [],
    'rating'        => $row['rating'] !== null ? (int)$row['rating'] : null,
    'start_date'    => $row['start_date'],
    'end_date'      => $row['end_date'],
    'eventCalender' => $row['eventCalender'] ? json_decode($row['eventCalender'], true) : [],
    'duration_days' => $row['duration_days'] !== null ? (int)$row['duration_days'] : null,
    'created_at'    => $row['created_at'],
  ];
}

echo json_encode($out, JSON_UNESCAPED_UNICODE);

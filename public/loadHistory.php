<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

set_error_handler(function($no,$str,$file,$line){
  throw new ErrorException($str, 0, $no, $file, $line);
});
set_exception_handler(function($e){
  http_response_code(200);
  echo json_encode([
    'ok'    => false,
    'error' => $e->getMessage(),
    'at'    => basename($e->getFile()).':'.$e->getLine()
  ], JSON_UNESCAPED_UNICODE);
  exit;
});

// helpers
function ok($arr = []) { echo json_encode(['ok'=>true] + $arr, JSON_UNESCAPED_UNICODE); exit; }
function jtry($v){ if(is_array($v)) return $v; $d=json_decode((string)$v,true); return is_array($d)?$d:[]; }

$raw = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true) ?: [];
$uid = trim($_GET['uid'] ?? $_POST['uid'] ?? $_POST['userid'] ?? $body['uid'] ?? $body['userid'] ?? '');

if ($uid === '') ok(['items'=>[]]);

$con = null;
$root = dirname(__DIR__);
$try = [
  __DIR__.'/db.php',
  $root.'/db.php',
  $root.'/config/db.php',
  $root.'/inc/db.php',
  $root.'/includes/db.php',
  $root.'/router/db.php'
];
foreach ($try as $p) {
  if (file_exists($p)) { require $p; break; }
}

if (!isset($con) || !$con) {
  $con = @mysqli_connect('127.0.0.1','root','','tripmaster');
}
if (!$con) throw new Exception('DB connect failed: '.mysqli_connect_error());
$sql = "SELECT id, dashid, userid, titlePlan, startDate, endDate, rating, notes, images, isActive
        FROM historydashboardtrips
        WHERE userid = ?
        ORDER BY id DESC
        LIMIT 50";
$stmt = mysqli_prepare($con, $sql);
if (!$stmt) throw new Exception('DB prepare failed');

mysqli_stmt_bind_param($stmt, 's', $uid);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

$items = [];
while ($row = mysqli_fetch_assoc($res)) {
  $items[] = [
    'id'         => (int)$row['id'],
    'dashid'     => (int)$row['dashid'],
    'user_id'    => $row['userid'],
    'title'      => $row['titlePlan'],
    'start_date' => $row['startDate'],
    'end_date'   => $row['endDate'],
    'rating'     => (int)$row['rating'],
    'notes'      => $row['notes'],
    'images'     => jtry($row['images']),
    'is_active'  => (int)$row['isActive'],
  ];
}

ok(['items'=>$items]);

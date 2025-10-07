<?php
// path: public/get_history.php
// ---- מה עושה ----
// מחזיר רשימת נסיעות עבר (historydashboardtrips) עבור uid.
// שים לב: פרטי המסלול (events/places) אינם כאן – נביאם לפי dashid דרך get_plan_by_id.php.

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require __DIR__.'/db.php';
mysqli_set_charset($con,'utf8mb4');

$raw  = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true) ?: [];
$uid  = trim($_GET['uid'] ?? $_POST['uid'] ?? $body['uid'] ?? '');

$out = ['ok'=>true,'items'=>[]];
if ($uid === '') { echo json_encode($out, JSON_UNESCAPED_UNICODE); exit; }

$sql = "SELECT hist_id AS id, dashid, userid, titlePlan, startDate, endDate, isActive
        FROM historydashboardtrips
        WHERE userid = ?
        ORDER BY hist_id DESC
        LIMIT 200";
$st = mysqli_prepare($con,$sql);
mysqli_stmt_bind_param($st,'s',$uid);
mysqli_stmt_execute($st);
$res = mysqli_stmt_get_result($st);

while($r = mysqli_fetch_assoc($res)){
  $out['items'][] = [
    'id'         => (int)$r['id'],
    'dashid'     => (int)$r['dashid'],
    'user_id'    => $r['userid'],
    'title'      => $r['titlePlan'],
    'start_date' => (string)$r['startDate'],
    'end_date'   => (string)$r['endDate'],
    'is_active'  => (int)$r['isActive'],
  ];
}
echo json_encode($out, JSON_UNESCAPED_UNICODE);

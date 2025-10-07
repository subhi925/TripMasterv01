<?php
// path: public/get_plan_by_id.php
// ---- מה הקובץ עושה (עברית קצרה) ----
// מקבל id/dash_id ומחזיר את פרטי התוכנית מטבלת dashboard בלבד.
// זהו "מקור אמת" יחיד לפרטי מסלול (eventCalender/places/dates).

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require __DIR__.'/db.php';
mysqli_set_charset($con,'utf8mb4');

$id = (int)($_GET['id'] ?? $_GET['dash_id'] ?? 0);
if ($id <= 0) { echo json_encode(['ok'=>false,'error'=>'missing id']); exit; }

$sql = "SELECT id, userid, titlePlan, startDate, endDate,
               eventCalender, places, dailyHours
        FROM dashboard WHERE id = ? LIMIT 1";
$st = mysqli_prepare($con,$sql);
if(!$st){ echo json_encode(['ok'=>false,'error'=>'prep']); exit; }
mysqli_stmt_bind_param($st,'i',$id);
mysqli_stmt_execute($st);
$res = mysqli_stmt_get_result($st);
$row = mysqli_fetch_assoc($res);
mysqli_stmt_close($st);

if(!$row){ echo json_encode(['ok'=>false,'error'=>'plan not found']); exit; }

$ev  = $row['eventCalender'];  $evA  = json_decode($ev, true);  if(!is_array($evA))  $evA = [];
$pl  = $row['places'];         $plA  = json_decode($pl,true);    if(!is_array($plA))  $plA = [];
$dh  = $row['dailyHours'];     $dhA  = json_decode($dh,true);    if(!is_array($dhA))  $dhA = [];

echo json_encode([
  'ok'            => true,
  'id'            => (int)$row['id'],
  'userid'        => $row['userid'],
  'titlePlan'     => (string)$row['titlePlan'],
  'startDate'     => (string)$row['startDate'],
  'endDate'       => (string)$row['endDate'],
  'eventCalender' => $evA,
  'places'        => $plA,
  'dailyHours'    => $dhA,
], JSON_UNESCAPED_UNICODE);

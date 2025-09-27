<?php
// path: public/get_history.php

// ===== CORS + JSON =====
$allowed = [
  'http://localhost:3000','http://127.0.0.1:3000',
  'http://localhost:8080','http://127.0.0.1:8080'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin,$allowed,true)) header("Access-Control-Allow-Origin: $origin"); else header("Access-Control-Allow-Origin: *");
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD']==='OPTIONS'){ http_response_code(204); exit; }
header("Content-Type: application/json; charset=utf-8");

// לא מדפיסים אזהרות למסך
ini_set('display_errors','0');
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// חיבור
require __DIR__.'/db.php'; // מספק $con, j_ok, j_err

$uid = trim($_GET['uid'] ?? '');
if ($uid==='') j_err('missing uid',400);

// הערה: טבלת historydashboardtrips לפי הצילומים שלך
// שדות שימושיים: id,dashid,userid,titlePlan,startDate,endDate,isActive
$sql = "SELECT id,dashid,userid,titlePlan,startDate,endDate,isActive
        FROM historydashboardtrips
        WHERE userid=?
        ORDER BY id DESC
        LIMIT 200";
$stmt = mysqli_prepare($con,$sql);
if(!$stmt) j_err('db error (prep)');
mysqli_stmt_bind_param($stmt,'s',$uid);
if(!mysqli_stmt_execute($stmt)) j_err('db error (exec)');
$res = mysqli_stmt_get_result($stmt);

$items=[];
while($r = mysqli_fetch_assoc($res)){
  // ended – אם יש endDate ועבר
  $ended = false;
  if (!empty($r['endDate'])) {
    $ended = (strtotime($r['endDate']) < time());
  }
  $items[] = [
    'id'         => (int)$r['id'],
    'dashid'     => (int)$r['dashid'],
    'user_id'    => $r['userid'],
    'title'      => $r['titlePlan'],
    'start_date' => $r['startDate'],
    'end_date'   => $r['endDate'],
    'ended'      => (bool)$ended,
    'is_active'  => (int)$r['isActive'],
  ];
}
mysqli_free_result($res);
mysqli_stmt_close($stmt);

j_ok(['items'=>$items]);

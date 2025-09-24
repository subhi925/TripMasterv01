<?php
// loadtodashboard.php، ترجع نفس الحقول كنصوص JSON
$allowed = ['http://localhost:3000','http://127.0.0.1:3000','http://localhost:8012','http://127.0.0.1:8012'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Vary: Origin');
if (in_array($origin, $allowed, true)) header("Access-Control-Allow-Origin: $origin");
else header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$debug = isset($_GET['debug']) ? (int)$_GET['debug'] : 0;
ini_set('display_errors', $debug ? '1' : '0');
error_reporting($debug ? E_ALL : (E_ALL & ~E_NOTICE & ~E_WARNING));
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db.php";
mysqli_set_charset($con, "utf8mb4");

// uid
$raw = file_get_contents("php://input");
$body = $raw ? json_decode($raw, true) : [];
$uid = '';
$uid = $_POST['uid']    ?? $uid;
$uid = $_POST['userId'] ?? $uid;
$uid = $_GET['uid']     ?? $uid;
$uid = $body['uid']     ?? $uid;
$uid = $body['userId']  ?? $uid;
$uid = trim((string)$uid);
if ($uid === '') { echo "[]"; exit; }

$uidEsc = mysqli_real_escape_string($con, $uid);
$sql = "
SELECT id, userid, titlePlan, startDate, endDate,
       places, smartDailyPlans, dailyHours, eventCalender, startloc, status
FROM dashboard
WHERE REPLACE(REPLACE(REPLACE(TRIM(userid), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') =
      REPLACE(REPLACE(REPLACE(TRIM('$uidEsc'), CHAR(9), ''), CHAR(10), ''), CHAR(13), '')
ORDER BY id DESC
LIMIT 200";

$out = [];
try {
  $res = mysqli_query($con, $sql);
  if (!$res) throw new Exception(mysqli_error($con));
  while ($r = mysqli_fetch_assoc($res)) {
    $places          = ($r['places']          === null || $r['places']          === '') ? '[]' : $r['places'];
    $smartDailyPlans = ($r['smartDailyPlans'] === null || $r['smartDailyPlans'] === '') ? '[]' : $r['smartDailyPlans'];
    $dailyHours      = ($r['dailyHours']      === null || $r['dailyHours']      === '') ? '[]' : $r['dailyHours'];
    $eventCalender   = ($r['eventCalender']   === null || $r['eventCalender']   === '') ? '[]' : $r['eventCalender'];
    $startloc        = ($r['startloc']        === null || $r['startloc']        === '') ? '{"lat":0,"lng":0}' : $r['startloc'];

    $out[] = [
      "id"             => (int)$r['id'],
      "userid"         => (string)$r['userid'],
      "titlePlan"      => (string)$r['titlePlan'],
      "startDate"      => (string)$r['startDate'],
      "endDate"        => (string)$r['endDate'],
      "places"         => (string)$places,
      "smartDailyPlans"=> (string)$smartDailyPlans,
      "dailyHours"     => (string)$dailyHours,
      "eventCalender"  => (string)$eventCalender,
      "startloc"       => (string)$startloc,
      "status"         => (string)$r['status'],
    ];
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  if ($debug) echo json_encode(["ok"=>false,"error"=>$e->getMessage()]);
  else echo "[]";
}

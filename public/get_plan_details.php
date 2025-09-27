<?php
// get_plan_details.php
// ✦ מקור יחיד לפרטי טיול מתוך טבלת dashboard.
// ✦ מחזיר: title, startDate, endDate, duration_days, eventCalender, places.
// ✦ מזהה טיול מתקבל כ: trip_id / dash_id / id

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require __DIR__ . "/db.php";
mysqli_set_charset($con, "utf8mb4");

// --- עזר: חישוב מספר ימים כולל (inclusive) ---
function calc_days(?string $start, ?string $end, array $events = []): int {
  $pick = function($k) use ($events) {
    $vals=[]; foreach ($events as $e){ if(!empty($e[$k])) $vals[]=$e[$k]; }
    if(!$vals) return null; sort($vals);
    return $k==='start' ? $vals[0] : $vals[count($vals)-1];
  };
  if (!$start) $start = $pick('start');
  if (!$end)   $end   = $pick('end');

  $t1 = $start ? strtotime($start) : false;
  $t2 = $end   ? strtotime($end)   : false;
  if($t1===false || $t2===false) return 0;
  return max(0, (int)floor(($t2-$t1)/86400) + 1);
}

// --- קלט מזהה ---
$tid = (int)($_GET['trip_id'] ?? $_GET['dash_id'] ?? $_GET['id'] ?? 0);
if ($tid <= 0) { echo json_encode(['ok'=>false,'error'=>'missing trip_id']); exit; }

// --- שליפה מה-dashboard ---
$sql = "SELECT id, titlePlan, startDate, endDate, eventCalender, places
        FROM dashboard WHERE id=? LIMIT 1";
$st = $con->prepare($sql);
$st->bind_param('i',$tid);
$st->execute();
$row = $st->get_result()->fetch_assoc();
$st->close();

if (!$row) { echo json_encode(['ok'=>false,'error'=>'trip not found']); exit; }

$ev  = json_decode($row['eventCalender'] ?? '[]', true) ?: [];
$pls = json_decode($row['places'] ?? '[]', true) ?: [];
$days = calc_days($row['startDate'] ?? '', $row['endDate'] ?? '', $ev);

// --- תשובה ---
echo json_encode([
  'ok'=>true,
  'data'=>[
    'trip_id'       => (int)$tid,
    'title'         => (string)($row['titlePlan'] ?? 'My Trip'),
    'startDate'     => (string)($row['startDate'] ?? ''),
    'endDate'       => (string)($row['endDate'] ?? ''),
    'duration_days' => $days,
    'eventCalender' => $ev,
    'places'        => $pls,
  ]
], JSON_UNESCAPED_UNICODE);

<?php
// קובץ: public/clone_plan.php
// משכפל סיפור (stories) לתכנית חדשה בטבלת dashboard לפי UID ותאריך התחלה חדש.
// מחזיר JSON תקני: { ok:true, id:<new id> } או { ok:false, error:"..." }

$allowed = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8012',
  'http://127.0.0.1:8012'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed, true)) {
  header("Access-Control-Allow-Origin: $origin");
} else {
  header("Access-Control-Allow-Origin: *");
}
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

header("Content-Type: application/json; charset=utf-8");
ini_set('display_errors', '0');             // לא להדפיס אזהרות/שגיאות על הגוף
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . "/db.php";
mysqli_set_charset($con, "utf8mb4");

function out($ok, $extra = []) {
  echo json_encode($ok ? array_merge(['ok'=>true], $extra)
                       : array_merge(['ok'=>false], $extra),
                   JSON_UNESCAPED_UNICODE);
  exit;
}

// -------- קריאת פרמטרים --------
$user_id   = trim($_POST['user_id']        ?? '');
$story_id  = (int)($_POST['story_id']      ?? 0);
$new_start = trim($_POST['new_start_date'] ?? '');
$dur_days  = max(1, (int)($_POST['duration_days'] ?? 1));
$title     = trim($_POST['title']          ?? '');

if ($user_id === '' || $story_id <= 0 || $new_start === '') {
  out(false, ['error'=>'missing parameters']);
}

// -------- טעינת הסיפור שממנו משכפלים --------
// שים לב: התאם שמות עמודות/טבלה אם אצלך שונים
$sql = "SELECT id, title, start_date, end_date, eventCalender
        FROM stories
        WHERE id = ? LIMIT 1";
$st = $con->prepare($sql);
if (!$st) out(false, ['error'=>'prepare failed (story)']);
$st->bind_param('i', $story_id);
if (!$st->execute()) out(false, ['error'=>'execute failed (story)']);
$story = $st->get_result()->fetch_assoc();
$st->close();

if (!$story) out(false, ['error'=>'story not found']);

// -------- הכנת נתונים לשיבוץ בטבלת dashboard --------
$events = [];
if (!empty($story['eventCalender'])) {
  $tmp = json_decode($story['eventCalender'], true);
  if (is_array($tmp)) $events = $tmp;
}

// קביעת תאריך הייחוס המקורי (מתחילת הסיפור או מהאירוע הראשון)
$origRef = null;
if (!empty($story['start_date'])) {
  $origRef = date_create($story['start_date']);
}
if (!$origRef && $events) {
  foreach ($events as $e) {
    if (!empty($e['start'])) { $origRef = date_create($e['start']); break; }
  }
}
if (!$origRef) $origRef = date_create($new_start); // נפילה בטוחה

$newRef   = date_create($new_start);
$diffDays = (int) floor((date_timestamp_get($newRef) - date_timestamp_get($origRef)) / 86400);

// הזזת תאריכים של האירועים לפי ההפרש
$shifted = [];
foreach ($events as $e) {
  if (!empty($e['start'])) {
    $d = date_create($e['start']);
    date_modify($d, ($diffDays >= 0 ? '+' : '').$diffDays.' days');
    $e['start'] = date_format($d, 'Y-m-d\TH:i');
  }
  if (!empty($e['end'])) {
    $d = date_create($e['end']);
    date_modify($d, ($diffDays >= 0 ? '+' : '').$diffDays.' days');
    $e['end'] = date_format($d, 'Y-m-d\TH:i');
  }
  $shifted[] = $e;
}

// בניית dailyHours לפי מספר הימים
$dailyHours = [];
$d = date_create($new_start);
for ($i=0; $i<$dur_days; $i++) {
  $dailyHours[] = ['day' => date_format($d, 'Y-m-d')];
  date_modify($d, '+1 day');
}

$startDate = $new_start;
$endDate   = date_format(date_modify(date_create($new_start), '+'.($dur_days-1).' days'), 'Y-m-d');

// עמודות נוספות – ברירת מחדל בטוחות
$smartDailyPlans = '[]';
$places          = '[]';
$startloc        = '{"lat":0,"lng":0}';

// -------- יצירה ב-dashboard --------
$ins = $con->prepare(
  "INSERT INTO dashboard
     (userid, titlePlan, startDate, endDate, eventCalender, dailyHours, smartDailyPlans, places, startloc, status)
   VALUES
     (?,?,?,?,?,?,?,?,?,'active')"
);
if (!$ins) out(false, ['error'=>'prepare failed (insert)']);

$evJson  = json_encode($shifted,     JSON_UNESCAPED_UNICODE);
$dhJson  = json_encode($dailyHours,  JSON_UNESCAPED_UNICODE);
$titleDB = ($title !== '' ? $title : ($story['title'] ?? 'My Trip'));

$ins->bind_param(
  'sssssssss',
  $user_id,
  $titleDB,
  $startDate,
  $endDate,
  $evJson,
  $dhJson,
  $smartDailyPlans,
  $places,
  $startloc
);

if (!$ins->execute()) {
  $err = mysqli_error($con);
  $ins->close();
  out(false, ['error'=>'insert failed', 'db'=>$err]);
}
$newId = $ins->insert_id;
$ins->close();

// הצלחה
out(true, ['id'=>$newId]);

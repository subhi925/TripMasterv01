<?php

$allowed = ['http://localhost:3000','http://127.0.0.1:3000','http://localhost:8080','http://127.0.0.1:8080'];
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . (in_array($origin,$allowed,true)? $origin : '*'));
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// -------- שגיאות ידידותיות --------
set_error_handler(function($no,$str,$file,$line){
  throw new ErrorException($str, 0, $no, $file, $line);
});
set_exception_handler(function($e){
  http_response_code(200);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
  exit;
});

// -------- קריאת קלט --------
// קורא הן מ-POST רגיל והן JSON body (כדי שיהיה נוח מכל צד)
$raw  = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true) ?: [];
$user_id        = trim($_POST['user_id']        ?? $body['user_id']        ?? '');
$story_id       = (int)($_POST['story_id']      ?? $body['story_id']      ?? 0);
$new_start_date = trim($_POST['new_start_date'] ?? $body['new_start_date'] ?? '');
$duration_days  = (int)($_POST['duration_days'] ?? $body['duration_days'] ?? 0);
$title_override = trim($_POST['title']          ?? $body['title']          ?? '');

if ($user_id === '' || $story_id <= 0 || $new_start_date === '') {
  echo json_encode(['ok'=>false,'error'=>'missing parameters (user_id, story_id, new_start_date)']); exit;
}

// -------- DB --------
$root = dirname(__DIR__);
$tried = false;
if (file_exists(__DIR__ . '/db.php')) { require __DIR__ . '/db.php'; $tried = true; }
elseif (file_exists($root . '/db.php')) { require $root . '/db.php'; $tried = true; }

if (!$tried || !isset($con) || !$con) {
  // נפילה בטוחה לפיתוח
  $con = @mysqli_connect('127.0.0.1','root','','tripmaster');
  if (!$con) throw new Exception('DB connect failed: '.mysqli_connect_error());
}
mysqli_set_charset($con, 'utf8mb4');

// -------- 1) נטען את הסיפור ממאגר stories --------
$st = mysqli_prepare($con, "SELECT id, title, start_date, end_date, eventCalender
                            FROM stories WHERE id=? LIMIT 1");
if (!$st) throw new Exception('prepare failed (story)');
mysqli_stmt_bind_param($st, 'i', $story_id);
mysqli_stmt_execute($st);
$rs = mysqli_stmt_get_result($st);
$story = mysqli_fetch_assoc($rs);
mysqli_stmt_close($st);

if (!$story) throw new Exception('story not found');

// -------- 2) נחשב תאריך עוגן מקורי (התחלה) ונזיז אירועים --------
// לוקחים את start_date של הסיפור, ואם אין – התאריך המוקדם מבין האירועים
$events = [];
if (!empty($story['eventCalender'])) {
  $tmp = json_decode($story['eventCalender'], true);
  if (is_array($tmp)) $events = $tmp;
}
$origRef = null;
if (!empty($story['start_date'])) {
  $origRef = date_create(substr($story['start_date'],0,10));
}
if (!$origRef && $events) {
  $min = null;
  foreach ($events as $e) {
    if (!empty($e['start'])) {
      $d = date_create(substr($e['start'],0,10));
      if ($d) { $ts = date_timestamp_get($d); $min = ($min===null? $ts : min($min,$ts)); }
    }
  }
  if ($min!==null) $origRef = date_create('@'.$min);
}
if (!$origRef) $origRef = date_create($new_start_date);

$newRef   = date_create($new_start_date);
$diffDays = (int) floor((date_timestamp_get($newRef) - date_timestamp_get($origRef)) / 86400);

// הזזת תאריכי האירועים לפי ההפרש
$shifted = [];
foreach ($events as $e) {
  if (!empty($e['start'])) {
    $d = date_create($e['start']);
    if ($d) { date_modify($d, ($diffDays>=0?'+':'').$diffDays.' days'); $e['start'] = date_format($d,'Y-m-d\TH:i'); }
  }
  if (!empty($e['end'])) {
    $d = date_create($e['end']);
    if ($d) { date_modify($d, ($diffDays>=0?'+':'').$diffDays.' days'); $e['end'] = date_format($d,'Y-m-d\TH:i'); }
  }
  $shifted[] = $e;
}

// -------- 3) חישוב משך ימים --------
$calcDuration = 0;
if ($duration_days > 0) {
  $calcDuration = $duration_days;
} else if (!empty($story['start_date']) && !empty($story['end_date'])) {
  $a = strtotime(substr($story['start_date'],0,10));
  $b = strtotime(substr($story['end_date'],0,10));
  if ($a && $b) $calcDuration = max(1, (int)round(($b-$a)/86400)+1);
} else if ($shifted) {
  $mins=[]; $maxs=[];
  foreach ($shifted as $e) {
    $as = !empty($e['start']) ? strtotime(substr($e['start'],0,10)) : null;
    $bs = !empty($e['end'])   ? strtotime(substr($e['end'],0,10))   : $as;
    if ($as||$bs) { $mins[]=$as??$bs; $maxs[]=$bs??$as; }
  }
  if ($mins && $maxs) $calcDuration = max(1, (int)round((max($maxs)-min($mins))/86400)+1);
}
if ($calcDuration <= 0) $calcDuration = 1;

// -------- 4) dailyHours + תאריכי התחלה/סיום חדשים --------
$dailyHours = [];
$d = date_create($new_start_date);
for ($i=0; $i<$calcDuration; $i++) {
  $dailyHours[] = ['day' => date_format($d, 'Y-m-d')];
  date_modify($d, '+1 day');
}
$startDate = $new_start_date;
$endDate   = date_format(date_modify(date_create($new_start_date), '+'.($calcDuration-1).' days'), 'Y-m-d');

// -------- 5) הכנסת מסלול חדש ל-dashboard --------
// שדות ברירת מחדל בטוחים
$smartDailyPlans = '[]';
$places          = '[]';
$startloc        = '{"lat":0,"lng":0}';
$titleDB         = ($title_override !== '' ? $title_override : ($story['title'] ?? 'My Trip'));

$evJson = json_encode($shifted,    JSON_UNESCAPED_UNICODE);
$dhJson = json_encode($dailyHours, JSON_UNESCAPED_UNICODE);

// מנסים עם כל העמודות; אם הטבלה אצלך בפורמט ישן – נופלים לשאילתה מצומצמת
$sqlFull = "INSERT INTO dashboard
  (userid, titlePlan, startDate, endDate, eventCalender, dailyHours, smartDailyPlans, places, startloc, status)
  VALUES (?,?,?,?,?,?,?,?,?,'active')";
$ins = mysqli_prepare($con, $sqlFull);
if ($ins) {
  mysqli_stmt_bind_param($ins,'sssssssss', $user_id,$titleDB,$startDate,$endDate,$evJson,$dhJson,$smartDailyPlans,$places,$startloc);
  if (!mysqli_stmt_execute($ins)) {
    $err = mysqli_error($con);
    mysqli_stmt_close($ins);
    throw new Exception('insert failed: '.$err);
  }
  $newId = mysqli_insert_id($con);
  mysqli_stmt_close($ins);
  echo json_encode(['ok'=>true,'id'=>$newId], JSON_UNESCAPED_UNICODE); exit;
}

// fallback 
$sqlLite = "INSERT INTO dashboard
  (userid, titlePlan, startDate, endDate, eventCalender, dailyHours, status)
  VALUES (?,?,?,?,?,?,'active')";
$ins2 = mysqli_prepare($con, $sqlLite);
if (!$ins2) throw new Exception('prepare failed (insert fallback)');
mysqli_stmt_bind_param($ins2,'ssssss', $user_id,$titleDB,$startDate,$endDate,$evJson,$dhJson);
if (!mysqli_stmt_execute($ins2)) {
  $err = mysqli_error($con);
  mysqli_stmt_close($ins2);
  throw new Exception('insert failed (fallback): '.$err);
}
$newId = mysqli_insert_id($con);
mysqli_stmt_close($ins2);

echo json_encode(['ok'=>true,'id'=>$newId], JSON_UNESCAPED_UNICODE);

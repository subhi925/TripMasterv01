<?php
// path: public/insert_story.php
// מוסיף סיפור לטבלת stories, עם חישוב duration_days ושמירת eventCalender ותמונות.

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require __DIR__ . "/db.php";            // $con (mysqli)
mysqli_set_charset($con, "utf8mb4");

/* ===================== הסבר (עברית) =====================
   - קוראים שדות מ-FormData (כולל photos[]).
   - מחשבים מספר ימים (duration_days) מתוך start/end או מתוך האירועים.
   - שומרים תמונות לתיקיית uploads/stories ומכניסים JSON למסד.
   - אם יש כבר סיפור לאותו user_id+trip_id → מחזירים exists=true.
   - אם לעמודת duration_days אין טור במסד (סכמה ישנה), נופלים אחורה
     לשאילתת INSERT בלי הטור הזה.
======================================================== */

$uid   = trim($_POST['user_id'] ?? '');
$trip  = (int)($_POST['trip_id'] ?? 0);
$title = trim($_POST['title'] ?? 'My Trip');
$country = trim($_POST['country'] ?? '');
$rating  = (int)($_POST['rating'] ?? 0);
$notes   = trim($_POST['notes'] ?? '');
$ecJson  = (string)($_POST['eventCalender'] ?? '[]');  // JSON string
$sd      = trim($_POST['start_date'] ?? '');
$ed      = trim($_POST['end_date']   ?? '');

if ($uid==='' || $trip<=0) { echo json_encode(['ok'=>false,'error'=>'missing user_id or trip_id']); exit; }

/* --- חשב ימים --- */
$duration_days = 0;
if ($sd && $ed) {
  $a = strtotime(substr($sd,0,10)); $b = strtotime(substr($ed,0,10));
  if ($a && $b) $duration_days = max(1, (int)round(($b-$a)/86400)+1);
} else {
  $ev = json_decode($ecJson, true); $mins=[]; $maxs=[];
  if (is_array($ev)) {
    foreach ($ev as $e) {
      $as = !empty($e['start']) ? strtotime(substr($e['start'],0,10)) : null;
      $bs = !empty($e['end'])   ? strtotime(substr($e['end'],0,10))   : $as;
      if ($as||$bs) { $mins[]=$as??$bs; $maxs[]=$bs??$as; }
    }
    if ($mins && $maxs) $duration_days = max(1, (int)round((max($maxs)-min($mins))/86400)+1);
  }
}

/* --- העלאת תמונות --- */
$uploadDir = __DIR__ . "/uploads/stories";
if (!is_dir($uploadDir)) { @mkdir($uploadDir, 0777, true); }
$imgs = [];
if (!empty($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
  for ($i=0,$n=count($_FILES['photos']['name']); $i<$n; $i++) {
    if ($_FILES['photos']['error'][$i] === UPLOAD_ERR_OK) {
      $tmp = $_FILES['photos']['tmp_name'][$i];
      $name = preg_replace('~[^a-zA-Z0-9_.-]+~','-', $_FILES['photos']['name'][$i]);
      $name = time()."_".mt_rand(1000,9999)."_".$name;
      $dest = $uploadDir."/".$name;
      if (move_uploaded_file($tmp,$dest)) $imgs[] = "uploads/stories/".$name;
    }
  }
}
$images_json = json_encode($imgs, JSON_UNESCAPED_UNICODE);

/* --- מניעת כפילות --- */
$chk = mysqli_prepare($con, "SELECT id FROM stories WHERE user_id=? AND trip_id=? LIMIT 1");
mysqli_stmt_bind_param($chk,"si",$uid,$trip);
mysqli_stmt_execute($chk);
$res = mysqli_stmt_get_result($chk);
if ($row = mysqli_fetch_assoc($res)) { echo json_encode(['ok'=>true,'id'=>(int)$row['id'],'exists'=>true]); exit; }
mysqli_free_result($res); mysqli_stmt_close($chk);

/* --- INSERT: קודם מנסים עם duration_days; אם אין עמודה, ניפול לשאילתה ללא העמודה --- */
$try1 = mysqli_prepare($con, "INSERT INTO stories
  (user_id, trip_id, title, country, start_date, end_date, created_at, rating, notes, images, eventCalender, duration_days)
  VALUES (?,?,?,?,?,?,NOW(),?,?,?, ?, ?)");
if ($try1) {
  mysqli_stmt_bind_param($try1,"sissssisssi", $uid,$trip,$title,$country,$sd,$ed,$rating,$notes,$images_json,$ecJson,$duration_days);
  if (!mysqli_stmt_execute($try1)) { $err = mysqli_error($con); mysqli_stmt_close($try1); echo json_encode(['ok'=>false,'error'=>$err]); exit; }
  $id = mysqli_insert_id($con); mysqli_stmt_close($try1);
  echo json_encode(['ok'=>true,'id'=>$id], JSON_UNESCAPED_UNICODE); exit;
}

/* fallback (סכמה ישנה בלי duration_days) */
$stmt = mysqli_prepare($con, "INSERT INTO stories
  (user_id, trip_id, title, country, start_date, end_date, created_at, rating, notes, images, eventCalender)
  VALUES (?,?,?,?,?,?,NOW(),?,?,?, ?)");
if (!$stmt) { echo json_encode(['ok'=>false,'error'=>'prep']); exit; }

mysqli_stmt_bind_param($stmt,"sissssisss", $uid,$trip,$title,$country,$sd,$ed,$rating,$notes,$images_json,$ecJson);
if (!mysqli_stmt_execute($stmt)) { echo json_encode(['ok'=>false,'error'=>mysqli_error($con)]); exit; }
$id = mysqli_insert_id($con); mysqli_stmt_close($stmt);

echo json_encode(['ok'=>true,'id'=>$id], JSON_UNESCAPED_UNICODE);

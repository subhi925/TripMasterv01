<?php
// path: public/insert_story.php
require_once __DIR__ . '/header_json.php'; // CORS + JSON headers
require_once __DIR__ . '/db.php';          // $con (mysqli) + helpers

// نسمح فقط POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['ok'=>false,'error'=>'POST required']); exit;
}

// قراءة المُدخلات
$user_id       = trim($_POST['user_id'] ?? '');
$trip_id       = (int)($_POST['trip_id'] ?? 0);            // id في historydashboardtrips
$title         = trim($_POST['title'] ?? 'My Trip');
$rating        = (int)($_POST['rating'] ?? 0);
$notes         = (string)($_POST['notes'] ?? '');
$eventCalJson  = (string)($_POST['eventCalender'] ?? '[]'); // JSON نصّي
$start_date    = trim($_POST['start_date'] ?? '');
$end_date      = trim($_POST['end_date'] ?? '');

if ($user_id === '' || $trip_id <= 0) {
  echo json_encode(['ok'=>false,'error'=>'Missing user_id or trip_id']); exit;
}

// جلب السطر الأصلي (نتأكد أنه موجود ونقرأ الصور الحالية)
$st = $con->prepare("SELECT userid, images FROM historydashboardtrips WHERE id=? LIMIT 1");
$st->bind_param('i', $trip_id);
$st->execute();
$src = $st->get_result()->fetch_assoc();
$st->close();

if (!$src) { echo json_encode(['ok'=>false,'error'=>'History row not found']); exit; }
// (اختياري) لو بدك تفرض أن نفس المستخدم فقط يشارك:
// if ($src['userid'] !== $user_id) { echo json_encode(['ok'=>false,'error'=>'Forbidden']); exit; }

// ========== رفع الصور ==========
$UP_DIR = __DIR__ . '/uploads/stories';
if (!is_dir($UP_DIR)) { @mkdir($UP_DIR, 0777, true); }

$images = [];
// الصور القديمة إن وجدت
$old = json_decode((string)$src['images'], true);
if (is_array($old)) { $images = $old; }

if (!empty($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
  $count = count($_FILES['photos']['name']);
  for ($i=0; $i<$count; $i++) {
    if (($_FILES['photos']['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
    $tmp  = $_FILES['photos']['tmp_name'][$i];
    $name = $_FILES['photos']['name'][$i];
    $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION) ?: 'jpg');
    if (!preg_match('/^(jpe?g|png|webp|gif)$/', $ext)) $ext = 'jpg';
    $base = uniqid('story_', true) . '.' . $ext;
    $dest = $UP_DIR . '/' . $base;
    if (@move_uploaded_file($tmp, $dest)) {
      // نخزن المسار كنِسبيّ ليستطيع الفرونت قراءته
      $images[] = 'uploads/stories/' . $base;
    }
  }
}
$images_json = json_encode($images, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

// تنظيف/تثبيت JSON الحدث
$evArr = json_decode($eventCalJson, true);
$eventCalJson = is_array($evArr)
  ? json_encode($evArr, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
  : '[]';

// قيم آمنة
$title      = mysqli_real_escape_string($con, $title);
$notes      = mysqli_real_escape_string($con, $notes);
$start_date = mysqli_real_escape_string($con, $start_date);
$end_date   = mysqli_real_escape_string($con, $end_date);

// نحدّث سطر الـhistory نفسه ليصبح Shared
$sql = "
UPDATE historydashboardtrips
SET
  titlePlan      = ?,
  rating         = ?,
  notes          = ?,
  images         = ?,
  isShared       = 1,
  shared_at      = NOW(),
  eventCalender  = ?,
  startDate      = NULLIF(?, ''),
  endDate        = NULLIF(?, '')
WHERE id = ?
";
$st = $con->prepare($sql);
$st->bind_param(
  'sisssssi',
  $title,
  $rating,
  $notes,
  $images_json,
  $eventCalJson,
  $start_date,
  $end_date,
  $trip_id
);
$ok = $st->execute();
$err = $ok ? '' : mysqli_error($con);
$st->close();

if (!$ok) { echo json_encode(['ok'=>false,'error'=>$err ?: 'DB error']); exit; }

echo json_encode(['ok'=>true, 'id'=>$trip_id], JSON_UNESCAPED_UNICODE);

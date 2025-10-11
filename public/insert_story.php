<?php
// public/insert_story.php
require __DIR__ . '/header_json.php';
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'POST only']); exit;
}

$uid    = trim($_POST['user_id']  ?? '');
$hid    = (int)($_POST['trip_id'] ?? 0);
$notes  = trim($_POST['notes']    ?? '');
$rating = (int)($_POST['rating']  ?? 0);

if ($uid === '' || $hid <= 0) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'Missing user_id or trip_id']); exit;
}

$images  = [];
$baseDir = __DIR__ . '/uploads/stories';
if (!is_dir($baseDir)) { @mkdir($baseDir, 0775, true); }

if (!empty($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
  $count = count($_FILES['photos']['name']);
  for ($i=0; $i<$count; $i++) {
    if (($_FILES['photos']['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
    $tmp  = $_FILES['photos']['tmp_name'][$i];
    $ext  = strtolower(pathinfo($_FILES['photos']['name'][$i], PATHINFO_EXTENSION)) ?: 'jpg';
    $name = 's_' . date('Ymd_His') . "{$hid}{$i}." . $ext;
    $dest = $baseDir . '/' . $name;
    if (@move_uploaded_file($tmp, $dest)) {
      $images[] = 'uploads/stories/' . $name; // مسار نسبي
    }
  }
}
$imgJson = json_encode($images, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

$sql = "UPDATE historydashboardtrips
        SET notes = ?, rating = ?, images = ?, isShared = 1, shared_at = NOW()
        WHERE id = ? AND userid = ?";
$st  = mysqli_prepare($con, $sql);
mysqli_stmt_bind_param($st, 'sisis', $notes, $rating, $imgJson, $hid, $uid);
$ok = mysqli_stmt_execute($st);

if (!$ok) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>mysqli_error($con)]); exit; }

echo json_encode(['ok'=>true,'id'=>$hid,'saved_images'=>$images], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

<?php
require __DIR__.'/header_json.php';
require __DIR__.'/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'POST only']); exit;
}

$id  = (int)($_POST['id'] ?? 0);
$uid = trim($_POST['user_id'] ?? ''); // اختياري

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'Missing id']); exit;
}

$sql = "UPDATE historydashboardtrips SET isShared = 0, shared_at = NULL WHERE id = ?";
if ($uid !== '') {
  // أمان إضافي فقط إن وصل uid، لكن لا نمنع التحديث إن كان خالي
  $sql .= " AND (userid = ? OR userid = '' OR userid IS NULL)";
  $stmt = mysqli_prepare($con, $sql);
  mysqli_stmt_bind_param($stmt, 'is', $id, $uid);
} else {
  $stmt = mysqli_prepare($con, $sql);
  mysqli_stmt_bind_param($stmt, 'i', $id);
}

$ok = mysqli_stmt_execute($stmt);
echo json_encode([
  'ok'       => (bool)$ok,
  'affected' => mysqli_stmt_affected_rows($stmt)
]);

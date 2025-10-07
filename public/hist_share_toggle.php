<?php
require_once __DIR__ . '/header_json.php';
require_once __DIR__ . '/db.php'; // أو _db_conn.php إذا عندك

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['ok'=>false,'error'=>'POST required']); exit;
}

$id    = (int)($_POST['id'] ?? 0);
$share = (int)($_POST['share'] ?? 0) ? 1 : 0;
if ($id <= 0) { echo json_encode(['ok'=>false,'error'=>'id required']); exit; }

$sql = $share
  ? "UPDATE historydashboardtrips SET isShared = 1, shared_at = NOW() WHERE id = ?"
  : "UPDATE historydashboardtrips SET isShared = 0, shared_at = NULL WHERE id = ?";

$st = $con->prepare($sql);               // $con = mysqli من db.php / _db_conn.php
$st->bind_param('i', $id);
$ok = $st->execute();

echo json_encode(['ok'=>$ok], JSON_UNESCAPED_UNICODE);

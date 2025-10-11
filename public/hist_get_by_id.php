<?php
// public/hist_get_by_id.php
require __DIR__.'/header_json.php';
require __DIR__.'/db.php';

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Missing id']); exit; }

$sql = "SELECT
          CAST(id AS UNSIGNED) AS id,
          userid               AS user_id,
          titlePlan            AS title,
          startDate            AS start_date,
          endDate              AS end_date,
          eventCalender, images, notes, rating,
          COALESCE(shared_at, created_at) AS created_at,
          shared_at
        FROM historydashboardtrips
        WHERE id = ?
        LIMIT 1";
$st = mysqli_prepare($con,$sql);
mysqli_stmt_bind_param($st,'i',$id);
mysqli_stmt_execute($st);
$res = mysqli_stmt_get_result($st);

$item = mysqli_fetch_assoc($res);
if (!$item) { echo json_encode(['ok'=>false,'error'=>'Not found']); exit; }

foreach (['eventCalender','images'] as $f) {
  if (isset($item[$f]) && is_string($item[$f])) {
    $tmp = json_decode($item[$f], true);
    if (json_last_error()===JSON_ERROR_NONE) $item[$f] = $tmp;
  }
}
$item['id'] = (int)$item['id'];

echo json_encode(['ok'=>true,'item'=>$item], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

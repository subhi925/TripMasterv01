<?php
require __DIR__.'/header_json.php';
require __DIR__.'/db.php';

$id = (int)($_GET['id'] ?? 0);
if ($id<=0) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Missing id']); exit; }

$st = mysqli_prepare($con,"SELECT
  id,
  userid      AS user_id,
  titlePlan   AS title,
  startDate   AS start_date,
  endDate     AS end_date,
  eventCalender, images, notes, rating, created_at, isShared
FROM historydashboardtrips WHERE id=? LIMIT 1");
mysqli_stmt_bind_param($st,'i',$id);
mysqli_stmt_execute($st);
$r = mysqli_stmt_get_result($st)->fetch_assoc();

if(!$r){ http_response_code(404); echo json_encode(['ok'=>false,'error'=>'Not found']); exit; }

foreach(['eventCalender','images'] as $f){
  if(isset($r[$f]) && is_string($r[$f])){
    $tmp = json_decode($r[$f], true);
    if (json_last_error()===JSON_ERROR_NONE) $r[$f] = $tmp;
  }
}
$r['id'] = (int)$r['id'];

echo json_encode(['ok'=>true,'item'=>$r], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

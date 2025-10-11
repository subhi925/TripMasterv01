<?php
// public/hist_list.php
require __DIR__.'/header_json.php';
require __DIR__.'/db.php';

$uid = $_GET['uid'] ?? '';
if ($uid === '') { echo json_encode(['ok'=>true,'items'=>[]]); exit; }

$sql = "SELECT
          CAST(id AS UNSIGNED) AS id,
          userid               AS user_id,
          titlePlan            AS title,
          startDate            AS start_date,
          endDate              AS end_date,
          eventCalender, images, notes, rating, created_at,
          COALESCE(isShared,0) AS isShared
        FROM historydashboardtrips
        WHERE userid = ?
          AND COALESCE(isShared,0) = 0   -- هذا هو الفلتر الصحيح
        ORDER BY COALESCE(created_at, startDate) DESC, id DESC
        LIMIT 200";

$st = mysqli_prepare($con,$sql);
mysqli_stmt_bind_param($st,'s',$uid);
mysqli_stmt_execute($st);
$res = mysqli_stmt_get_result($st);

$items=[];
while($r=mysqli_fetch_assoc($res)){
  foreach(['eventCalender','images'] as $f){
    if(isset($r[$f]) && is_string($r[$f])){
      $tmp = json_decode($r[$f], true);
      if (json_last_error()===JSON_ERROR_NONE) $r[$f] = $tmp;
    }
  }
  $r['id'] = (int)$r['id'];
  $items[] = $r;
}
echo json_encode(['ok'=>true,'items'=>$items], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

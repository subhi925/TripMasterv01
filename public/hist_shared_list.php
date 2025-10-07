<?php
require __DIR__.'/header_json.php';
require __DIR__.'/db.php';

$order = (($_GET['sort'] ?? 'new') === 'old') ? 'ASC' : 'DESC';

$sql = "SELECT
          CAST(id AS UNSIGNED)            AS id,
          userid                          AS user_id,
          titlePlan                       AS title,
          startDate                       AS start_date,
          endDate                         AS end_date,
          (DATEDIFF(endDate,startDate)+1) AS duration_days,
          eventCalender, images, notes, rating, created_at, isShared
        FROM historydashboardtrips
        WHERE (isActive=0 OR isActive IS NULL)
          AND (isShared=1 OR isShared='1')
        ORDER BY created_at $order, id $order
        LIMIT 200";

$res = mysqli_query($con,$sql);
$items = [];
if ($res) {
  while ($row = mysqli_fetch_assoc($res)) {
    foreach (['eventCalender','images','notes'] as $f) {
      if (isset($row[$f]) && is_string($row[$f])) {
        $tmp = json_decode($row[$f], true);
        if (json_last_error()===JSON_ERROR_NONE) $row[$f] = $tmp;
      }
    }
    $row['id'] = (int)$row['id']; // id אחיד
    $items[] = $row;
  }
}
echo json_encode(['ok'=>true,'items'=>$items], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

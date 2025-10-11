<?php
require __DIR__.'/header_json.php';
require __DIR__.'/db.php';

$q    = trim($_GET['q'] ?? '');
$sort = $_GET['sort'] ?? 'new';

$where = "isShared = 1"; // فقط المنشور
if ($q !== '') {
  $qq = "%".mysqli_real_escape_string($con, $q)."%";
  $where .= " AND (titlePlan LIKE '$qq' OR notes LIKE '$qq')";
}

$order = ($sort === 'rating')
  ? "ORDER BY rating DESC, COALESCE(shared_at, created_at) DESC"
  : "ORDER BY COALESCE(shared_at, created_at) DESC";

$sql = "
SELECT
  id,
  userid,
  titlePlan,
  startDate   AS start_date,
  endDate     AS end_date,
  eventCalender,
  images,
  notes,
  rating,
  created_at,
  shared_at,
  isShared
FROM historydashboardtrips
WHERE $where
$order
LIMIT 200";

$res = mysqli_query($con, $sql);
$items = [];
if ($res) {
  while ($r = mysqli_fetch_assoc($res)) {
    $items[] = [
      'id'            => (int)$r['id'],
      'user_id'       => (string)$r['userid'],
      'title'         => (string)$r['titlePlan'],
      'start_date'    => (string)$r['start_date'],
      'end_date'      => (string)$r['end_date'],
      'eventCalender' => ($r['eventCalender'] === null || $r['eventCalender'] === '') ? '[]' : $r['eventCalender'],
      'images'        => ($r['images']        === null || $r['images']        === '') ? '[]' : $r['images'],
      'notes'         => (string)($r['notes'] ?? ''),
      'rating'        => (int)($r['rating'] ?? 0),
      'created_at'    => (string)$r['created_at'],
      'shared_at'     => (string)$r['shared_at'],
      'isShared'      => (int)$r['isShared'],
    ];
  }
}
echo json_encode(['ok'=>true, 'items'=>$items], JSON_UNESCAPED_UNICODE);

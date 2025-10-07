<?php
require __DIR__ . '/db.php';
/* ضع هنا بلوك CORS كما في القسم 2 */

$uid = $_GET['uid'] ?? '';
if ($uid === '') { echo json_encode(['ok'=>false,'error'=>'missing uid']); exit; }

$sql = "
SELECT 
  id,
  userid,
  titlePlan,
  startDate,
  endDate,
  isActive,
  rating,
  notes,
  isShared,
  created_at,
  -- حساب عدد الأيام
  DATEDIFF(endDate, startDate) + 1 AS days,
  -- طول الحدث وعدسة معاينة
  LENGTH(eventCalender) AS ev_len,
  LEFT(eventCalender, 160) AS ev_preview
FROM historydashboardtrips
WHERE userid = ?
ORDER BY id DESC
";
$stmt = $con->prepare($sql);
$stmt->bind_param("s", $uid);
$stmt->execute();
$res = $stmt->get_result();

$out = [];
while ($r = $res->fetch_assoc()) { $out[] = $r; }
echo json_encode(['ok'=>true,'rows'=>$out]);

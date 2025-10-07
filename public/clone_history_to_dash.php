<?php
require_once __DIR__ . '/header_json.php';
require_once __DIR__ . "/db.php";

/*
  يستنسخ رحلة history إلى dashboard ببداية جديدة
  إدخال: uid, hist_id, newStartDate (YYYY-MM-DD)
*/
$uid   = $_POST['uid'] ?? '';
$hid   = intval($_POST['hist_id'] ?? 0);
$start = $_POST['newStartDate'] ?? '';

if ($uid==='' || $hid<=0 || $start==='') {
  echo json_encode(["ok"=>false,"error"=>"Missing parameters"]); exit;
}

$uid   = mysqli_real_escape_string($con,$uid);
$start = mysqli_real_escape_string($con,$start);

// جلب الخطة الأصلية
$src = mysqli_query($con, "SELECT *,(DATEDIFF(endDate,startDate)+1) AS days FROM historydashboardtrips WHERE id=$hid LIMIT 1");
$plan = mysqli_fetch_assoc($src);
if(!$plan){ echo json_encode(["ok"=>false,"error"=>"history plan not found"]); exit; }

// حساب تاريخ النهاية الجديد بنفس طول الرحلة
$days = max(1,intval($plan['days'] ?? 1));
$endDateSql = "DATE_ADD('$start', INTERVAL ".($days-1)." DAY)";

// إدخال في dashboard (أسماء أعمدة من جدولك الظاهر بالصورة)
$sql = "
INSERT INTO dashboard
(userid, smartDailyPlans, eventCalender, dailyHours, places, startloc,
 startDate, endDate, isActive, titlePlan, status, isShared)
VALUES (
  '$uid',
  ".sql_str_or_null($plan['smartDailyPlans']).",
  ".sql_str_or_null($plan['eventCalender']).",
  ".sql_str_or_null($plan['dailyHours']).",
  ".sql_str_or_null($plan['places']).",
  '',
  '$start',
  $endDateSql,
  1,
  CONCAT('Cloned - ', ".sql_str_or_null($plan['titlePlan'])."),
  'active',
  'No'
)";
$ok = mysqli_query($con,$sql);
if(!$ok){ echo json_encode(["ok"=>false,"error"=>mysqli_error($con)]); exit; }

$newId = mysqli_insert_id($con);
echo json_encode(["ok"=>true,"dash_id"=>$newId]);

mysqli_close($con);

/* helpers */
function sql_str_or_null($s){
  if ($s===null) return "NULL";
  $esc = addslashes($s);
  return "'$esc'";
}

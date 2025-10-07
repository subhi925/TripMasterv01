<?php
require __DIR__.'/header_json.php';
require __DIR__.'/db.php';

// (עברית) קריאת פרמטרים
$story_id      = (int)($_POST['story_id'] ?? 0);
$user_id       = trim($_POST['user_id'] ?? '');
$new_start     = trim($_POST['new_start_date'] ?? '');
$duration_days = max(1,(int)($_POST['duration_days'] ?? 0));
$title         = trim($_POST['title'] ?? 'My Trip');

if ($story_id<=0 || $user_id==='' || $new_start==='' || $duration_days<=0) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Missing parameters']); exit;
}

// (עברית) טעינת תוכנית מההיסטוריה
$q = mysqli_query($con, "SELECT titlePlan, eventCalender, places, dailyHours, smartDailyPlans
                         FROM historydashboardtrips WHERE id=$story_id LIMIT 1");
$src = $q ? mysqli_fetch_assoc($q) : null;
if(!$src){ http_response_code(404); echo json_encode(['ok'=>false,'error'=>'Source not found']); exit; }

// (עברית) חישוב תאריכים חדשים
$start = date('Y-m-d', strtotime($new_start));
$end   = date('Y-m-d', strtotime($start.' +'.($duration_days-1).' days'));

// (עברית) הוספה ל-dashboard
$titlePlan = mysqli_real_escape_string($con, $title.' · Cloned');
$uid       = mysqli_real_escape_string($con, $user_id);
$ev        = mysqli_real_escape_string($con, $src['eventCalender'] ?: '[]');
$pl        = mysqli_real_escape_string($con, $src['places'] ?: '[]');
$dh        = mysqli_real_escape_string($con, $src['dailyHours'] ?: '[]');
$smart     = mysqli_real_escape_string($con, $src['smartDailyPlans'] ?: '[]');

$sql = "INSERT INTO dashboard
        (userid, smartDailyPlans, eventCalender, dailyHours, places,
         startDate, endDate, isActive, titlePlan, status, isShared)
        VALUES
        ('$uid','$smart','$ev','$dh','$pl','$start','$end',1,'$titlePlan','active','No')";
$ok = mysqli_query($con,$sql);
if(!$ok){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>mysqli_error($con)]); exit; }

echo json_encode(['ok'=>true,'new_id'=>mysqli_insert_id($con)], JSON_UNESCAPED_UNICODE);

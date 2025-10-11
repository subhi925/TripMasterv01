<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// -----------------------------------------------------------------
//  Includes & Setup
// -----------------------------------------------------------------
require __DIR__ . '/header_json.php';
require __DIR__ . '/db.php';
mysqli_set_charset($con, 'utf8mb4');

// -----------------------------------------------------------------
//  Helper
// -----------------------------------------------------------------
function fail(int $code, string $msg)
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only');

// -----------------------------------------------------------------
//  Get POST data
// -----------------------------------------------------------------
$story_id  = (int)($_POST['story_id'] ?? 0);
$uid       = trim((string)($_POST['user_id'] ?? ''));
$title     = trim((string)($_POST['title'] ?? 'My Trip'));
$new_start = trim((string)($_POST['new_start_date'] ?? ''));
$days      = max(1, (int)($_POST['duration_days'] ?? 1));

if ($uid === '') fail(400, 'Missing user_id');

//  Validate start date
if ($new_start === '' || strtotime($new_start) === false) {
    fail(400, 'Invalid or missing start date');
}

// -----------------------------------------------------------------
//  Load source trip
// -----------------------------------------------------------------
$ev = '[]';
$places = '[]';
$smart = '[]';
$daily = '[]';
$startloc = '{"lat":0,"lng":0}';

if ($story_id > 0) {
    $sql = "SELECT titlePlan, eventCalender, places, smartDailyPlans, dailyHours, startloc
            FROM historydashboardtrips
            WHERE id = ?
            LIMIT 1";

    $stSrc = mysqli_prepare($con, $sql);
    mysqli_stmt_bind_param($stSrc, 'i', $story_id);
    mysqli_stmt_execute($stSrc);
    $res = mysqli_stmt_get_result($stSrc);

    if (!$res) fail(500, mysqli_error($con));
    $src = mysqli_fetch_assoc($res);
    if (!$src) fail(404, 'Source trip not found');

    $title    = $title ?: $src['titlePlan'];
    $ev       = $src['eventCalender'] ?: '[]';
    $places   = $src['places'] ?: '[]';
    $smart    = $src['smartDailyPlans'] ?: '[]';
    $daily    = $src['dailyHours'] ?: '[]';
    $startloc = $src['startloc'] ?: '{"lat":0,"lng":0}';
}

// -----------------------------------------------------------------
//  Dates
// -----------------------------------------------------------------
$start = date('Y-m-d', strtotime($new_start));
$end   = date('Y-m-d', strtotime("$start + " . ($days - 1) . " days"));

// -----------------------------------------------------------------
// 5. Adjust dailyHours dates
// -----------------------------------------------------------------
if (is_string($daily) && $daily !== '') {
    $arrDaily = json_decode($daily, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($arrDaily)) {
        $newDaily = [];
        for ($i = 0; $i < $days; $i++) {
            if (isset($arrDaily[$i])) {
                $dayObj = $arrDaily[$i];
                $dayObj['day'] = date('Y-m-d', strtotime("$start + $i days"));
                $newDaily[] = $dayObj;
            } else {
                // אם אין מספיק ימים במקור, יוצרים יום חדש עם שעות ברירת מחדל
                $newDaily[] = [
                    'day' => date('Y-m-d', strtotime("$start + $i days")),
                    'start' => '08:00',
                    'end' => '22:00'
                ];
            }
        }
        $daily = json_encode($newDaily, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

// -----------------------------------------------------------------
//  Fix events dates (convert for FullCalendar ISO format)
// -----------------------------------------------------------------
if (is_string($ev) && $ev !== '') {
    $arr = json_decode($ev, true);

    if (json_last_error() === JSON_ERROR_NONE && is_array($arr)) {
        foreach ($arr as &$e) {
            $oldStart = strtotime($e['start'] ?? $start);
            $oldEnd   = strtotime($e['end'] ?? $start);

            $timeStart = date('H:i:s', $oldStart);
            $timeEnd   = date('H:i:s', $oldEnd);

            //  FullCalendar expects ISO8601 format: 2025-10-14T09:00:00
            $e['start'] = $start . 'T' . $timeStart;
            $e['end']   = $start . 'T' . $timeEnd;
        }
        unset($e);

        $ev = json_encode($arr, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
if ($ev === null || $ev === false) $ev = '[]';

// -----------------------------------------------------------------
//  Status
// -----------------------------------------------------------------
$isActive = (strtotime($end) >= strtotime(date('Y-m-d'))) ? 1 : 0;

// -----------------------------------------------------------------
//  Insert into dashboard
// -----------------------------------------------------------------
$sqlDash = "INSERT INTO dashboard
(userid, titlePlan, startDate, endDate, places, smartDailyPlans, dailyHours, eventCalender, startloc, isActive)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$st = mysqli_prepare($con, $sqlDash);
if (!$st) fail(500, mysqli_error($con));

mysqli_stmt_bind_param(
    $st,
    'sssssssssi',
    $uid, $title, $start, $end,
    $places, $smart, $daily, $ev, $startloc,
    $isActive
);

if (!mysqli_stmt_execute($st)) fail(500, mysqli_error($con));

$dash_id = mysqli_insert_id($con);

// -----------------------------------------------------------------
//  Return JSON
// -----------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok' => true,
    'dashboard_id' => $dash_id,
    'isActive' => $isActive,
    'start' => $start,
    'end' => $end
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>

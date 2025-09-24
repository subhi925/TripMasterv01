# path: public/insert_story.php
<?php
$allowed = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8012',
  'http://127.0.0.1:8012'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed, true)) {
  header("Access-Control-Allow-Origin: $origin");
} else {
  header("Access-Control-Allow-Origin: *"); 
}
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

header("Content-Type: application/json; charset=utf-8");
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
require __DIR__.'/db.php';

$user_id = trim($_POST['user_id'] ?? '');
if ($user_id === '') json_err('user_id required');

$trip_id = isset($_POST['trip_id']) ? trim($_POST['trip_id']) : null;
$title   = trim($_POST['title']   ?? 'My Trip');
$rating  = isset($_POST['rating']) ? (int)$_POST['rating'] : 5;
$notes   = trim($_POST['notes']   ?? '');
$country = trim($_POST['country'] ?? '');
$evJson  = $_POST['eventCalender'] ?? '[]';
$start   = trim($_POST['start_date'] ?? '');
$end     = trim($_POST['end_date']   ?? '');
$days    = compute_days($start, $end);

if ($rating < 1 || $rating > 5) $rating = 5;

// העלאת קבצים (אופציונאלי) — שומר מסלולים יחסיים כמו בדוגמא
$relPaths = [];
if (!empty($_FILES['photos']['name']) && is_array($_FILES['photos']['name'])) {
  $count = count($_FILES['photos']['name']);
  $dir = uploads_dir();
  for ($i=0; $i<$count; $i++) {
    if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) continue;
    $ext = pathinfo($_FILES['photos']['name'][$i], PATHINFO_EXTENSION);
    $base = 'p_'.uniqid().'.'.($ext ?: 'jpg');
    $dest = $dir . '/' . $base;
    if (move_uploaded_file($_FILES['photos']['tmp_name'][$i], $dest)) {
      $relPaths[] = rel_upload_path($base);
    }
  }
}

$imagesJson = json_encode($relPaths, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
$evJson     = is_string($evJson) ? $evJson : json_encode($evJson, JSON_UNESCAPED_UNICODE);

$sql = "INSERT INTO stories (user_id, trip_id, title, notes, country, images, rating, start_date, end_date, eventCalender, duration_days, created_at)
        VALUES (:user_id, :trip_id, :title, :notes, :country, :images, :rating, :start_date, :end_date, :eventCalender, :duration_days, NOW())";
$stmt = pdo()->prepare($sql);
$stmt->execute([
  ':user_id' => $user_id,
  ':trip_id' => $trip_id ?: null,
  ':title'   => $title,
  ':notes'   => $notes,
  ':country' => $country,
  ':images'  => $imagesJson,
  ':rating'  => $rating,
  ':start_date' => $start ?: null,
  ':end_date'   => $end   ?: null,
  ':eventCalender' => $evJson,
  ':duration_days' => $days,
]);

json_ok(['id'=> (int)pdo()->lastInsertId()]);

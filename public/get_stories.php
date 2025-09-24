<?php
// CORS + JSON (أول سطر في الملف بدون أي بايتات قبلها)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // أو غيّرها إلى http://localhost:3000 إذا حاب تقيدها
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/db.php'; // اتصال mysqli

// ... بقية كودك الحالي (الذي في الصورة عندك) ...
/*  get_stories.php
    מחזיר רשימת סיפורים (stories) בפורמט JSON.
    הערות בעברית כדי להגיש באקדמיה:
    - מאוחד ל-mysqli דרך db.php (לא PDO).
    - תמיד מחזיר JSON; שגיאות מוחזרות כ-JSON, לא HTML.
*/

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

// לא להדפיס אזהרות ללקוח
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . "/db.php"; // מגדיר $con (mysqli)
mysqli_set_charset($con, "utf8mb4");

// ---- קבלת פרמטרים מה-GET ----
$q         = isset($_GET['q']) ? trim($_GET['q']) : "";
$ratingEq  = isset($_GET['ratingEq']) ? trim($_GET['ratingEq']) : "all";
$sort      = isset($_GET['sort']) ? trim($_GET['sort']) : "new";

$where = [];
if ($q !== "") {
  $s = mysqli_real_escape_string($con, $q);
  $where[] = "(title LIKE '%$s%' OR country LIKE '%$s%' OR notes LIKE '%$s%')";
}
if ($ratingEq !== "all" && ctype_digit($ratingEq)) {
  $r = (int)$ratingEq;
  if ($r >= 1 && $r <= 5) $where[] = "rating = $r";
}
$sql = "SELECT id,user_id,trip_id,title,notes,country,images,rating,start_date,end_date,eventCalender,duration_days,created_at
        FROM stories";
if ($where) $sql .= " WHERE " . implode(" AND ", $where);
$order = ($sort === "rating") ? "rating DESC, id DESC" : "id DESC";
$sql .= " ORDER BY $order LIMIT 200";

$out = ["ok"=>true, "items"=>[]];

try {
  $res = mysqli_query($con, $sql);
  if (!$res) throw new Exception(mysqli_error($con));
  while ($row = mysqli_fetch_assoc($res)) {
    // לוודא ששדות JSON נשארים כמחרוזת תקינה (הלקוח כבר יודע לפרש)
    $out["items"][] = [
      "id"            => (int)$row["id"],
      "user_id"       => $row["user_id"],
      "trip_id"       => $row["trip_id"] !== null ? (int)$row["trip_id"] : null,
      "title"         => $row["title"],
      "notes"         => $row["notes"],
      "country"       => $row["country"],
      "images"        => $row["images"] ? json_decode($row["images"], true) : [],
      "rating"        => ($row["rating"] !== null ? (int)$row["rating"] : null),
      "start_date"    => $row["start_date"],
      "end_date"      => $row["end_date"],
      "eventCalender" => $row["eventCalender"] ? json_decode($row["eventCalender"], true) : [],
      "duration_days" => ($row["duration_days"] !== null ? (int)$row["duration_days"] : null),
      "created_at"    => $row["created_at"],
    ];
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["ok"=>false, "error"=>"DB error", "detail"=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}

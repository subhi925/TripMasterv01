<?php
// --------------------------------------------
// insert_notice.php
// יוצר רשומת מודעה (bulletin) חדשה בטבלת notices
// תואם למבנה הפרויקט: mysqli + db.php
// קולט JSON או form-data ומחזיר JSON בלבד
// --------------------------------------------

header("Access-Control-Allow-Origin: *");              // הרשה כל מקור (פשוט לפיתוח)
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db.php";     // $con (mysqli)
mysqli_set_charset($con, "utf8mb4");  // תמיכה בעברית/אמוג'י

// ---- קריאת גוף הבקשה כ־JSON, ואם אין – נשתמש ב־$_POST ----
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data) || empty($data)) {
  $data = $_POST; // fallback אם שלחתם form-urlencoded
}

// ---- בדיקת שדות חובה ----
$required = ["type", "title", "description"];
foreach ($required as $k) {
  if (!isset($data[$k]) || trim($data[$k]) === "") {
    http_response_code(422);
    echo json_encode(["ok"=>false, "error"=>"שדה חסר: $k"], JSON_UNESCAPED_UNICODE);
    exit;
  }
}

// ---- ניקוי/הכנה לערכים ----
$user_id     = mysqli_real_escape_string($con, $data["user_id"]     ?? "");
$name        = mysqli_real_escape_string($con, $data["name"]        ?? "");
$contact     = mysqli_real_escape_string($con, $data["contact"]     ?? "");
$type        = mysqli_real_escape_string($con, $data["type"]);
$title       = mysqli_real_escape_string($con, $data["title"]);
$description = mysqli_real_escape_string($con, $data["description"]);
$location    = mysqli_real_escape_string($con, $data["location"]    ?? "");
$trip_dates  = mysqli_real_escape_string($con, $data["trip_dates"]  ?? "");

// ---- INSERT לטבלה ----
// ודא שעמודות הטבלה notices תואמות לשמות כאן.
$sql = "INSERT INTO `notices`
        (`user_id`,`name`,`contact`,`type`,`title`,`description`,`location`,`trip_dates`,`created_at`)
        VALUES
        ('$user_id','$name','$contact','$type','$title','$description','$location','$trip_dates', NOW())";

if (!mysqli_query($con, $sql)) {
  http_response_code(500);
  echo json_encode([
    "ok"=>false,
    "error"=>"DB",
    "detail"=>mysqli_error($con)
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$id = mysqli_insert_id($con);
echo json_encode(["ok"=>true, "id"=>$id], JSON_UNESCAPED_UNICODE);
mysqli_close($con);

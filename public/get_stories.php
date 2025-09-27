<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . "/db.php"; // הגדרת $con
mysqli_set_charset($con, "utf8mb4");

// ---- קבלת פרמטרים ----
$q        = isset($_GET['q']) ? trim($_GET['q']) : "";
$ratingEq = isset($_GET['ratingEq']) ? trim($_GET['ratingEq']) : "all";
$sort     = isset($_GET['sort']) ? trim($_GET['sort']) : "new";

$where = [];
if ($q !== "") {
    $s = mysqli_real_escape_string($con, $q);
    $where[] = "(title LIKE '%$s%' OR country LIKE '%$s%' OR notes LIKE '%$s%')";
}
if ($ratingEq !== "all" && ctype_digit($ratingEq)) {
    $r = (int)$ratingEq;
    if ($r >= 1 && $r <= 5) $where[] = "rating = $r";
}

$sql = "SELECT id,user_id,title,notes,country,images,rating,start_date,end_date,eventCalender 
        FROM stories";
if ($where) $sql .= " WHERE " . implode(" AND ", $where);
$order = ($sort === "rating") ? "rating DESC, id DESC" : "id DESC";
$sql .= " ORDER BY $order LIMIT 200";

$out = ["ok"=>true, "items"=>[]];

try {
    $res = mysqli_query($con, $sql);
    if (!$res) throw new Exception(mysqli_error($con));

    while ($row = mysqli_fetch_assoc($res)) {
        $out["items"][] = [
            "id"            => (int)$row["id"],
            "user_id"       => $row["user_id"],
            "title"         => $row["title"],
            "notes"         => $row["notes"],
            "country"       => $row["country"],
            "images"        => isset($row["images"]) && $row["images"] ? json_decode($row["images"], true) : [],
            "rating"        => isset($row["rating"]) ? (int)$row["rating"] : null,
            "start_date"    => $row["start_date"],
            "end_date"      => $row["end_date"],
            "eventCalender" => isset($row["eventCalender"]) && $row["eventCalender"] ? json_decode($row["eventCalender"], true) : [],
        ];
    }
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["ok"=>false, "error"=>"DB error", "detail"=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}

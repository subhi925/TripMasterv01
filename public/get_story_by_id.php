<?php
// path: public/get_story_by_id.php

// ===== CORS בסיסי לפיתוח =====
$allowed = [
  'http://localhost:3000','http://127.0.0.1:3000',
  'http://localhost:8012','http://127.0.0.1:8012'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin,$allowed,true)) header("Access-Control-Allow-Origin: $origin"); else header("Access-Control-Allow-Origin: *");
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD']==='OPTIONS'){ http_response_code(204); exit; }
header("Content-Type: application/json; charset=utf-8");

// אל תדפיסו אזהרות למסך כדי לא לשבור JSON
ini_set('display_errors','0');
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// חיבור לבסיס הנתונים – משתמשים ב-db.php שלך כמו שהוא
require __DIR__.'/db.php'; // מספק $con, j_ok, j_err, json_try

$id = (int)($_GET['id'] ?? 0);
if ($id<=0) j_err('missing id', 400);

// הערה: שדות אפשריים בטבלת stories אצלך
// id, user_id, trip_id, title, start_date, end_date, created_at, rating, notes, images(json), eventCalender(json), country, duration_days
$sql = "SELECT id,user_id,trip_id,title,start_date,end_date,created_at,rating,notes,images,eventCalender,country,duration_days
        FROM stories WHERE id=?";
$stmt = mysqli_prepare($con,$sql);
if(!$stmt) j_err('db error (prep)');
mysqli_stmt_bind_param($stmt,'i',$id);
if(!mysqli_stmt_execute($stmt)) j_err('db error (exec)');
$res = mysqli_stmt_get_result($stmt);
$row = mysqli_fetch_assoc($res);
mysqli_free_result($res);
mysqli_stmt_close($stmt);

if(!$row) j_err('not found',404);

// פענוח JSON לשדות תמונות/לו״ז
$images = json_try($row['images'] ?? '[]');
$events = json_try($row['eventCalender'] ?? '[]');

$item = [
  'id'            => (int)$row['id'],
  'user_id'       => $row['user_id'],
  'trip_id'       => (int)($row['trip_id'] ?? 0),
  'title'         => $row['title'],
  'start_date'    => $row['start_date'],
  'end_date'      => $row['end_date'],
  'created_at'    => $row['created_at'],
  'rating'        => is_null($row['rating'])? null : (int)$row['rating'],
  'notes'         => $row['notes'],
  'images'        => $images,        // מערך נתיבים
  'eventCalender' => $events,        // מערך אירועים
  'country'       => $row['country'],
  'duration_days' => is_null($row['duration_days'])? null : (int)$row['duration_days'],
];

j_ok(['item'=>$item]);

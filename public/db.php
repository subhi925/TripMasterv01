<?php
/**
 * קובץ חיבור לבסיס הנתונים (MySQLi).
 * חשוב: אין להדפיס שום דבר למסך מלבד JSON מהסקריפטים הקוראים.
 */

header('Access-Control-Allow-Origin: *');         // לאפשר קריאות מהדפדפן
header('Content-Type: application/json; charset=utf-8');

// אין הדפסת שגיאות למסך כדי לא לשבור JSON
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

// קביעת פרמטרים - עדכן במידת הצורך
$DB_HOST = '127.0.0.1';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'tripmaster';

// חיבור
$con = @mysqli_connect($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if (!$con) {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>'DB connect failed: '.mysqli_connect_error()], JSON_UNESCAPED_UNICODE);
  exit;
}
mysqli_set_charset($con, 'utf8mb4');

/**
 * פונקציות עזר ל־JSON כדי שיהיה פלט אחיד.
 */
function j_ok($arr = []) {
  echo json_encode(['ok'=>true] + $arr, JSON_UNESCAPED_UNICODE);
  exit;
}
function j_err($msg, $code=200) {
  http_response_code($code);
  echo json_encode(['ok'=>false, 'error'=>$msg], JSON_UNESCAPED_UNICODE);
  exit;
}
function json_try($v) {
  if (is_array($v)) return $v;
  $d = json_decode((string)$v, true);
  return is_array($d) ? $d : [];
}

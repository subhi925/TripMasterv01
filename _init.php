<?php
// public/_init.php
// ---- DB + CORS + JSON helpers ----
ini_set('display_errors', 0);           // حتى لا يرجع تحذيرات HTML تكسر JSON
error_reporting(E_ALL);

$host = "127.0.0.1";
$user = "root";
$pass = "";
$db   = "tripmaster";
$port = 3306;

$con = new mysqli($host, $user, $pass, $db, $port);
if ($con->connect_error) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(["ok"=>false,"error"=>"db_connect","msg"=>$con->connect_error], JSON_UNESCAPED_UNICODE);
  exit;
}
$con->set_charset('utf8mb4');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');

function json_ok($data, $code=200){
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
?>

<?php
// --------- CORS & JSON helpers ---------
// פונקציית אתחול בסיסית: כותרות CORS ופורמט JSON עקבי

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:3000','http://127.0.0.1:3000','http://localhost','http://localhost:8080'];
if ($origin && in_array($origin, $allowed, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Vary: Origin");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Accept, Origin");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

header('Content-Type: application/json; charset=utf-8');

// פונקציה: החזרת JSON וסיום
function respond($data, $code=200){
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

// פונקציה: קריאת פרמטר בבטחה
function param($k, $def=null){
  return $_POST[$k] ?? $_GET[$k] ?? $def;
}

// פונקציה: JSON decode בטוח
function json_decode_safe($s){
  if ($s === null || $s === '') return null;
  $j = json_decode($s, true);
  return (json_last_error()===JSON_ERROR_NONE)? $j : null;
}

<?php
// ========= CORS =========
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
  'http://localhost:3000', 'http://127.0.0.1:3000',
  'http://localhost:8080', 'http://127.0.0.1:8080'
];
$allow = in_array($origin, $allowed, true) ? $origin : '*';

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: $allow");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ========= DB =========
try {
  // عدّل اسم القاعدة/المستخدم حسب بيئتك
  $db = new PDO('mysql:host=127.0.0.1;dbname=tripmaster;charset=utf8mb4','root','',[
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB connection failed: '.$e->getMessage()], JSON_UNESCAPED_UNICODE);
  exit;
}

function ok($data = [])   { echo json_encode(['ok'=>true] + $data, JSON_UNESCAPED_UNICODE); exit; }
function fail($m,$c=400)  { http_response_code($c); echo json_encode(['ok'=>false,'error'=>$m], JSON_UNESCAPED_UNICODE); exit; }
function current_user_id(){ return 1; } // مؤقتًا

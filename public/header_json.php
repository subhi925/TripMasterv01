<?php
// public/header_json.php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
$allowed = [
  'http://localhost:3000','http://127.0.0.1:3000',
  'http://localhost:8080','http://127.0.0.1:8080'
];
if (!in_array($origin, $allowed, true)) $origin = '*';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: '.$origin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET,POST,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// لا نطبع تحذيرات داخل الاستجابة
ini_set('display_errors', 0);
error_reporting(E_ERROR | E_PARSE);

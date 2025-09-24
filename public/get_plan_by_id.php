# path: public/get_plan_by_id.php
<?php
// ===== CORS + JSON + إخفاء التحذيرات على الشاشة =====
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
  header("Access-Control-Allow-Origin: *"); // للـ Dev فقط
}
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// ردّ الـPreflight مباشرةً
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

header("Content-Type: application/json; charset=utf-8");

// لا نطبع تحذيرات HTML داخل الرد JSON
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);


/* 
  פרטי תכנית לפי מזהה
  קלט GET: id
*/
require _DIR_.'/db.php';

$id = (int)($_GET['id'] ?? 0);
if ($id<=0) json_err('Missing id');

$stmt = pdo()->prepare("SELECT id, user_id, titlePlan, eventCalender, startDate, endDate, created_at
                        FROM plans WHERE id = ?");
$stmt->execute([$id]);
$it = $stmt->fetch();
if (!$it) json_err('Not found', 404);

$it['eventCalender'] = safe_json_array($it['eventCalender']);
json_ok(['item'=>$it]);

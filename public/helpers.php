<?php // public/_helpers.php
function jtry($s){
  if (is_array($s)) return $s;
  if (!is_string($s) || $s==='') return [];
  $x = json_decode($s, true);
  return json_last_error()===JSON_ERROR_NONE && is_array($x) ? $x : [];
}
function normalize_hist_row($r){
  $id = (int)($r['id'] ?? $r['history_id'] ?? 0);
  return [
    'id'           => $id,                // <-- هذا ما ستستخدمه الواجهة دائمًا
    'history_id'   => $id,
    'dashboard_id' => (int)($r['dashboard_id'] ?? 0),
    'story_id'     => (int)($r['story_id'] ?? 0),
    'user_id'      => (string)($r['user_id'] ?? $r['userid'] ?? ''),
    'title'        => (string)($r['title'] ?? $r['titlePlan'] ?? 'My Trip'),
    'start_date'   => (string)($r['start_date'] ?? $r['startDate'] ?? ''),
    'end_date'     => (string)($r['end_date'] ?? $r['endDate'] ?? ''),
    'eventCalender'=> jtry($r['eventCalender'] ?? '[]'),
    'images'       => jtry($r['images'] ?? '[]'),
    'notes'        => is_array($r['notes'] ?? null) ? $r['notes'] : (string)($r['notes'] ?? ''),
    'rating'       => (int)($r['rating'] ?? 0),
    'created_at'   => (string)($r['created_at'] ?? ''),
    'isShared'     => (int)($r['isShared'] ?? 0),
  ];
}

<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include("db.php");

// ---- בדיקה אם הפרמטרים הגיעו ----
$requiredParams = ['id_Shared_Trip', 'uid'];
foreach ($requiredParams as $param) {
    if (!isset($_POST[$param]) || empty(trim($_POST[$param]))) {
        echo("Missing or empty parameter: " . $param);
        exit();
    }
}

// ---- קבלת הערכים ----
$id_Shared_Trip = mysqli_real_escape_string($con, $_POST['id_Shared_Trip']);
$uid = mysqli_real_escape_string($con, $_POST['uid']);

// ---- בדיקה אם המשתמש כבר הצטרף ----
$checkUserSql = "SELECT joinedUsers, current_Num_Part, NumOfPartners FROM askforpartners WHERE id_Shared_Trip='$id_Shared_Trip'";
$res = mysqli_query($con, $checkUserSql);
if (!$res || mysqli_num_rows($res) == 0) {
    echo("Trip not found");
    exit();
}

$row = mysqli_fetch_assoc($res);
$joinedUsers = $row['joinedUsers'] ? explode(',', $row['joinedUsers']) : [];
$current_Num_Part = (int)$row['current_Num_Part'];
$NumOfPartners = (int)$row['NumOfPartners'];

// ---- בדיקה אם המשתמש כבר הצטרף ----
if (in_array($uid, $joinedUsers)) {
    echo("Already joined");
    exit();
}

// ---- בדיקה אם הטיול מלא ----
if ($current_Num_Part >= $NumOfPartners) {
    echo("Trip is full");
    exit();
}

// ---- עדכון current_Num_Part ו-joinedUsers ----
$joinedUsers[] = $uid;
$current_Num_Part = count($joinedUsers);
$joinedStr = implode(',', $joinedUsers);
$updateSql = "UPDATE askforpartners
              SET current_Num_Part='$current_Num_Part', joinedUsers='$joinedStr'
              WHERE id_Shared_Trip='$id_Shared_Trip'";

if (mysqli_query($con, $updateSql)) {
    $find_to_dashboard_sql = "SELECT `id_Shared_Trip`,`uid` FROM askforpartners WHERE `id_Shared_Trip`='$id_Shared_Trip'";
    $result = mysqli_query($con, $find_to_dashboard_sql);
    
    if ($result && mysqli_num_rows($result) > 0) {
        $row = mysqli_fetch_assoc($result);
        $shared_trip_id = $row['id_Shared_Trip'];
        $trip_uid = $row['uid'];
    }
    
    if($shared_trip_id && $trip_uid){
        $take_trip_par = "SELECT * FROM dashboard WHERE `id_Shared_Trip` = '$shared_trip_id' AND `userid` = '$trip_uid'";
        $res = mysqli_query($con,$take_trip_par);
        
if($res && mysqli_num_rows($res) > 0){
    $row = mysqli_fetch_assoc($res);
    $smartDailyPlans = mysqli_real_escape_string($con, $row['smartDailyPlans']);
    $eventCalender = mysqli_real_escape_string($con, $row['eventCalender']);
    $dailyHours = mysqli_real_escape_string($con, $row['dailyHours']);
    $places = mysqli_real_escape_string($con, $row['places']);
    $startloc = mysqli_real_escape_string($con, $row['startloc']);
    $startDate = mysqli_real_escape_string($con, $row['startDate']);
    $endDate = mysqli_real_escape_string($con, $row['endDate']);
    $isActive = mysqli_real_escape_string($con, $row['isActive']);
    $titlePlan = mysqli_real_escape_string($con, $row['titlePlan']);
    $id_Shared_Trip = mysqli_real_escape_string($con, $row['id_Shared_Trip']);
    $isShared = mysqli_real_escape_string($con, $row['isShared']);
}

$insert_the_shared_sql = "INSERT INTO `dashboard`
                         (`userid`, `smartDailyPlans`, `eventCalender`, `dailyHours`, `places`, `startloc`, `startDate`, `endDate`, `isActive`, `titlePlan`, `id_Shared_Trip`, `isShared`)
                         VALUES ('$uid', '$smartDailyPlans', '$eventCalender', '$dailyHours', '$places', '$startloc', '$startDate', '$endDate', '$isActive', '$titlePlan', '$id_Shared_Trip', '$isShared')";
        $res = mysqli_query($con, $insert_the_shared_sql);
        
        if($res){
            echo("Success");
        } else {
            echo("Error copying trip: " . mysqli_error($con));
        }
    }
} else {
    echo("Error updating trip: " . mysqli_error($con));
}

mysqli_close($con);
?>
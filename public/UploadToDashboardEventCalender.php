<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
include("db.php");

$requiredParams = ['uid', 'eventCalender', 'id'];

foreach ($requiredParams as $param) {
    if (!isset($_POST[$param]) || empty(trim($_POST[$param]))) {
        echo("Missing or empty parameter: " . $param);
        exit();
    }
}


//----Save the values sent from MyPlan.js  ----
$userId = mysqli_real_escape_string($con, $_POST['uid']);//mysqli_real_escape_string 
$eventCalender = mysqli_real_escape_string($con, $_POST['eventCalender']);
$id = mysqli_real_escape_string($con, $_POST['id']);

//------------------------
$update_sql = "UPDATE `dashboard` SET `eventCalender` = '$eventCalender' WHERE `id` = '$id' AND `userid` = '$userId'";

if (mysqli_query($con, $update_sql)) {
    echo("Success to Update");
} else {
    echo("Failed to Update: " . mysqli_error($con));
}

mysqli_close($con);
?>
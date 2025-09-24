<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
include("db.php");

//---- Check if there is a null value------
$requiredParams = ['userId', 'places', 'isActive', 'titlePlan', 'eventCalender', 'id'];
foreach ($requiredParams as $param) {
    if (!isset($_POST[$param]) || trim($_POST[$param]) === '') {
        echo("Missing or empty parameter: " . $param);
        exit();
    }
}
//----Save the values sent from MyPlan.js----
$userId       = mysqli_real_escape_string($con, $_POST['userId']);
$places       = mysqli_real_escape_string($con, $_POST['places']);
$titlePlan    = mysqli_real_escape_string($con, $_POST['titlePlan']);
$isActive     = mysqli_real_escape_string($con, $_POST['isActive']);
$eventCalender= mysqli_real_escape_string($con, $_POST['eventCalender']);

//---------------------------------------------------------
$insertsql = "INSERT INTO `historydashboardtrips`
(`id`, `userid`, `eventCalender`, `places`, `isActive`, `titlePlan`) 
VALUES 
('$id','$userId','$eventCalender','$places','$isActive','$titlePlan')";

if (mysqli_query($con, $insertsql)) {
    echo("Success to Insert");
} else {
    echo("Failed to Insert");
}

mysqli_close($con);
?>
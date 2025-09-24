<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
include("db.php");

//---- Check if there is a null value------
$requiredParams = ['userId', 'smartDailyPlans', 'places', 'dailyHours', 'startDate', 'endDate', 'isActive','titlePlan'];

foreach ($requiredParams as $param) {
    if (!isset($_POST[$param]) || empty(trim($_POST[$param]))) {
        echo("Missing or empty parameter: " . $param);
        exit();
    }
}


//----Save the values sent from MyPlan.js  ----
$userId = mysqli_real_escape_string($con, $_POST['userId']);//mysqli_real_escape_string 
$smartDailyPlans = mysqli_real_escape_string($con, $_POST['smartDailyPlans']);
$places = mysqli_real_escape_string($con, $_POST['places']);
$dailyHours = mysqli_real_escape_string($con, $_POST['dailyHours']);
$startDate = mysqli_real_escape_string($con, $_POST['startDate']);
$endDate = mysqli_real_escape_string($con, $_POST['endDate']);
$isActive = mysqli_real_escape_string($con, $_POST['isActive']);
$startloc = mysqli_real_escape_string($con,$_POST['startloc']);
$titlePlan = mysqli_real_escape_string($con, $_POST['titlePlan']);
$eventCalender = isset($_POST['eventCalender']) ? $_POST['eventCalender'] : '[]';
$eventCalender = mysqli_real_escape_string($con, $eventCalender);
//------------------------
$insert_sql = "INSERT INTO `dashboard` 
(`userid`, `smartDailyPlans`, `places`, `dailyHours`, `startDate`, `endDate`, `isActive`, `titlePlan`, `eventCalender`,`startloc`) 
VALUES 
('$userId', '$smartDailyPlans', '$places', '$dailyHours', '$startDate', '$endDate', '$isActive', '$titlePlan', '$eventCalender','$startloc')";

 if (mysqli_query($con, $insert_sql)) {
        echo("Success to Insert");
    } else {
         echo("Failed to Insert: " . mysqli_error($con));
    }
mysqli_close($con);
?>

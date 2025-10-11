<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
include("db.php");

//---- Check if there is a null value------
$requiredParams = [
    'id',
    'userId',
    'eventCalender',
    'places',
    'isActive',
    'titlePlan',
    'startDate',
    'endDate',
    'smartDailyPlans',
    'dailyHours',
    ,'startloc',
];

foreach ($requiredParams as $param) {
    if (!isset($_POST[$param]) || trim($_POST[$param]) === '') {
        echo("Missing or empty parameter: " . $param);
        exit();
    }
}
//----Save the values sent from MyPlan.js----
$id              = mysqli_real_escape_string($con, $_POST['id']);
$userid          = mysqli_real_escape_string($con, $_POST['userId']);
$eventCalender   = mysqli_real_escape_string($con, $_POST['eventCalender']);
$places          = mysqli_real_escape_string($con, $_POST['places']);
$isActive        = mysqli_real_escape_string($con, $_POST['isActive']);
$titlePlan       = mysqli_real_escape_string($con, $_POST['titlePlan']);
$startDate       = mysqli_real_escape_string($con, $_POST['startDate']);
$endDate         = mysqli_real_escape_string($con, $_POST['endDate']);
$smartDailyPlans = mysqli_real_escape_string($con, $_POST['smartDailyPlans']);
$dailyHours      = mysqli_real_escape_string($con, $_POST['dailyHours']);
$startloc        = mysqli_real_escape_string($con, $_POST['startloc']);

//---------------------------------------------------------
$insertsql = "
INSERT INTO `historydashboardtrips`
(`id` , `userid`, `eventCalender`, `places`, `isActive`, `titlePlan`, `startDate`, `endDate`, `smartDailyPlans`, `dailyHours`, `startloc`)
VALUES
('$id', '$userid', '$eventCalender', '$places', '$isActive', '$titlePlan', '$startDate', '$endDate', '$smartDailyPlans', '$dailyHours', '$startloc')
";

if (mysqli_query($con, $insertsql)) {
    echo("Success to Insert");
} else {
    echo("Failed to Insert");
}

mysqli_close($con);
?>
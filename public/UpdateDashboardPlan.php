<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include("db.php");

// ---- Check if there is a null value ------
if (
    !isset($_POST['uid']) || empty($_POST['uid']) ||
    !isset($_POST['id']) || empty($_POST['id']) ||
    !isset($_POST['dailyHours']) ||
    !isset($_POST['startDate']) ||
    !isset($_POST['endDate']) ||
    !isset($_POST['eventCalender'])
) {
    echo("Missing Parameters");
    exit();
}

// ---- Save the values sent from DashBoard.js ----
$uid = $_POST['uid'];
$id = $_POST['id'];
$dailyHours = mysqli_real_escape_string($con, $_POST['dailyHours']);
$startDate = mysqli_real_escape_string($con, $_POST['startDate']);
$endDate = mysqli_real_escape_string($con, $_POST['endDate']);
$eventCalender = mysqli_real_escape_string($con, $_POST['eventCalender']);

// --- SQL to check if this plan exists in the database ---
$sql = "SELECT * FROM `dashboard` WHERE `userid`='$uid' AND `id`='$id'";
$result = mysqli_query($con, $sql);

if (mysqli_num_rows($result) > 0) {
    // --- Plan Exists - Update ---
    $update_sql = "UPDATE `dashboard` 
                   SET `dailyHours` = '$dailyHours',
                       `startDate` = '$startDate',
                       `endDate` = '$endDate',
                       `eventCalender` = '$eventCalender'
                   WHERE `userid` = '$uid' AND `id` = '$id'";
    if (mysqli_query($con, $update_sql)) {
        echo("Success to Update");
    } else {
        echo("Failed to Update");
    }
}

mysqli_close($con);
?>

<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
include("db.php");

//---- Check if there is a null value------
if (!isset($_POST['userId']) || empty($_POST['userId']) || !isset($_POST['preferences'])) {
    echo("Missing Parameters");
    exit();
}

//----Save the values sent from Profile.js
$userId = $_POST['userId'];
$preferences = mysqli_real_escape_string($con, $_POST['preferences']);

//---SQL to check if this user exists in the database
$sql = "SELECT * FROM `ProfilesUser` WHERE `user_id`='$userId'";
$result = mysqli_query($con, $sql);

if (mysqli_num_rows($result) > 0) {
    //---User Exists-- Update Preferences
    $update_sql = "UPDATE `ProfilesUser` SET `preferences` = '$preferences' WHERE `user_id` = '$userId'";
    if (mysqli_query($con, $update_sql)) {
        echo("Success to Update");
    } else {
        echo("Failed to Update");
    }
} else {
    // Add new user to the database
$insert_sql = "INSERT INTO `ProfilesUser` (`user_id`, `preferences`) VALUES ('$userId', '$preferences')";
    if (mysqli_query($con, $insert_sql)) {
        echo("Success to Insert");
    } else {
        echo("Failed to Insert");
    }
}

mysqli_close($con);
?>

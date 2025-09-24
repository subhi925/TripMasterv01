<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

include ("db.php");

//---- Check if there is a null value------
if (!isset($_POST['userId']) || empty($_POST['userId']) ) {
    echo("Missing Parameters");
    exit();
}

//----Save the values sent from Profile.js
$userId = $_POST['userId'];

//----Check if user ID in the Database to Get preferences----
$sql = "SELECT preferences FROM `ProfilesUser` WHERE `user_id`='$userId'";
$res = mysqli_query($con, $sql);
if (mysqli_num_rows($res)>0){
    //---get the row vlue---
    $row = mysqli_fetch_assoc($res);
    //----print the perferences--
    echo json_encode(json_decode($row['preferences']));
} else {
    echo ("user not exist");
}
mysqli_close($con); 
?>

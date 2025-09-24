<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
include("db.php");
// בדיקת פרמטרים שהתקבלו
if (!isset($_POST['userId']) || empty($_POST['userId'])) {
    echo("Missing Parameters");
    exit();
}

$userId = $_POST['userId'];

// בדיקה אם המשתמש קיים בטבלת ProfilesUser
$sql = "SELECT * FROM `ProfilesUser` WHERE `user_id`='$userId'";
$result = mysqli_query($con, $sql);

if (mysqli_num_rows($result) > 0) {
    echo("Exist");
} else {
    echo("Not Exist");
}
mysqli_close($con); 
?>

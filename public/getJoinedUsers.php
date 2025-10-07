<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 

include("db.php"); // חיבור ל־DB דרך קובץ db.php

// בדיקה אם התקבל id_Shared_Trip
if(!isset($_POST['id_Shared_Trip']) || empty($_POST['id_Shared_Trip'])){
    echo json_encode(["error" => "Missing Parameters"]);
    exit();
}

$id_Shared_Trip = $_POST['id_Shared_Trip'];

// שליפת joinedUsers לפי id_Shared_Trip
$findusersql = "SELECT joinedUsers FROM askforpartners WHERE id_Shared_Trip = '$id_Shared_Trip'";
$res = mysqli_query($con, $findusersql);

if(mysqli_num_rows($res) > 0){
    $row = mysqli_fetch_assoc($res);
    // נניח ש-joinedUsers שמור כמחרוזת מופרדת בפסיקים
    $joinedUsersArray = explode(",", $row['joinedUsers']);
    echo json_encode(["joinedUsers" => $joinedUsersArray]);
} else {
    echo json_encode(["joinedUsers" => []]);
}

mysqli_close($con);
?>

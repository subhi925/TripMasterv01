<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
include("db.php");

//---- Check if there is a null value------
$requiredParams = ['uid', 'dashboard_id', 'titlePlan', 'startdate', 'enddate', 'msgBox','preference', 'numberOfPartners', 'current_Num_Part'];
foreach ($requiredParams as $param) {
    if (!isset($_POST[$param]) || empty(trim($_POST[$param]))) {
        echo("Missing or empty parameter: " . $param);
        exit();
    }
}

//----Save the values sent from Asklist.js  ----
$uid = mysqli_real_escape_string($con, $_POST['uid']);//mysqli_real_escape
$dashboard_id = mysqli_real_escape_string($con, $_POST['dashboard_id']);
$titlePlan = mysqli_real_escape_string($con, $_POST['titlePlan']);              
$startdate = mysqli_real_escape_string($con, $_POST['startdate']);
$enddate = mysqli_real_escape_string($con, $_POST['enddate']);
$Msg = mysqli_real_escape_string($con, $_POST['msgBox']);
$preference = mysqli_real_escape_string($con, $_POST['preference']);
$numberOfPartners = mysqli_real_escape_string($con, $_POST['numberOfPartners']);
$current_Num_Part = mysqli_real_escape_string($con, $_POST['current_Num_Part']);
$eventCalender= mysqli_real_escape_string($con,$_POST['eventCalender']);
$joinedStr = mysqli_real_escape_string($con, $_POST['joinedUsers']);
//-------------check if this trip is Exists in DB----------
$check_sql = "SELECT * FROM `askforpartners` WHERE `dashboard_id`='$dashboard_id' AND `titlePlan` = '$titlePlan' AND `startdate`='$startdate' AND `enddate`='$enddate'";
$res = mysqli_query($con, $check_sql);
if (mysqli_num_rows($res) > 0 ){
    echo("This Plan Is Exists");
}
else{
            // -----insert the values into the database------
        $insert_sql = "INSERT INTO `askforpartners` 
        (`uid`, `dashboard_id`, `titlePlan`, `startdate`, `enddate`, `Msg`, `preference`, `NumOfPartners`, `current_Num_Part`,`eventCalender`,`joinedUsers`)
        VALUES ('$uid', '$dashboard_id', '$titlePlan', '$startdate', '$enddate', '$Msg', '$preference', '$numberOfPartners', '$current_Num_Part', '$eventCalender', '$joinedStr')";

        if (mysqli_query($con, $insert_sql)){
            $new_id_Shared_Trip = mysqli_insert_id($con);
            $update_dashboard_sql = "UPDATE `dashboard` SET `isShared` = 'Yes', `id_Shared_Trip` = '$new_id_Shared_Trip' WHERE `id` = '$dashboard_id' ";
            mysqli_query($con,$update_dashboard_sql);
            echo("Success to put your Ask");
        }
        else{
            echo("Faild To Insert" . mysqli_error($con));

        }

}
//------------------------------------------------------


mysqli_close($con);
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); 
include ("db.php");

//---- Check if there is a null value------
$requiredParams = ['id', 'uid'];

foreach ($requiredParams as $param) {
    if (!isset($_POST[$param]) || empty(trim($_POST[$param]))) {
        echo("Missing or empty parameter: " . $param);
        exit();
    }
}

$id = $_POST['id'];
$uid = $_POST['uid'];
$sql = "DELETE FROM `dashboard` WHERE `id` = '$id' AND `userid` = '$uid'";
$result = mysqli_query($con, $sql);
if($result){
    echo("Success");
}
else {
    echo("Not Delete");
}
mysqli_close($con);
?>
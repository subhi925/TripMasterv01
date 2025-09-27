<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 

include ("db.php");


//---Check the parmeters we get
if(!isset($_POST['uid'])|| empty($_POST['uid'])){
	echo("Missing Parameters");
	exit();
}
//----save the userId to local parmeter
$userId = $_POST['uid'];

$findusersql = "SELECT * FROM `dashboard` WHERE `userid` = '$userId'";
$res = mysqli_query($con,$findusersql);

if(mysqli_num_rows($res) > 0){
    $rows = array();
	while($row = mysqli_fetch_assoc($res))
    {
        $rows[] = $row;

    }
    echo json_encode($rows);
}
else
{
    echo("No data");
}
mysqli_close($con);
?>
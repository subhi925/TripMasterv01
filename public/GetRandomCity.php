<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

include ("db.php");

//---Check the parameters we get
if(!isset($_POST['month']) || empty($_POST['month'])){
	echo("Missing Parameters");
	exit();
}

//----save the month to local parameter
$month = $_POST['month'];

// Find match cities to month random the resualt and choose one by limit 1
//ORDER BY RAND() to random the resualt
//LIMIT1 take just one resualt from
//https://www.w3schools.com/sql/sql_top.asp
$findCitiesSql = "SELECT * FROM `cities` WHERE FIND_IN_SET('$month', recommended_months) > 0 ORDER BY RAND() LIMIT 1";
$res = mysqli_query($con, $findCitiesSql);

if(mysqli_num_rows($res) > 0){
    $city = mysqli_fetch_assoc($res);
    echo json_encode($city);
}
else {
    // if there non cities choose randomly
    $randomCitySql = "SELECT * FROM `cities` ORDER BY RAND() LIMIT 1";
    $randomRes = mysqli_query($con, $randomCitySql);
    
    if(mysqli_num_rows($randomRes) > 0){
        $city = mysqli_fetch_assoc($randomRes);
        echo json_encode($city);
    }
    else {
        echo("No cities found");
    }
}

mysqli_close($con);
?>
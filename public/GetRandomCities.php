<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

include ("db.php");

//---Check the parameters we get
if(!isset($_POST['month']) || empty($_POST['month'])){
    echo json_encode([]);
    exit();
}

//----save the month to local parameter
$month = $_POST['month'];

// Find all cities that match the month
$findCitiesSql = "SELECT * FROM `cities` WHERE FIND_IN_SET('$month', recommended_months) > 0";
$res = mysqli_query($con, $findCitiesSql);

$cities = [];
if(mysqli_num_rows($res) > 0){
    while($row = mysqli_fetch_assoc($res)){
        $cities[] = $row;
    }
}

// return all matching cities as JSON array
echo json_encode($cities);

mysqli_close($con);
?>

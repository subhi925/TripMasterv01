<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json"); 

include ("db.php");
 $sql_Load = "SELECT * FROM `askforpartners`";
 $res = mysqli_query($con, $sql_Load);

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
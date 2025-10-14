<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include("db.php");

// ✅ Check that all required parameters exist and are not empty
$requiredParams = ['uid', 'eventCalender', 'id', 'isShared', 'id_Shared_Trip'];
foreach ($requiredParams as $param) {
    if (!isset($_POST[$param]) || empty(trim($_POST[$param]))) {
        echo("Missing or empty parameter: " . $param);
        exit();
    }
}

//  Sanitize input values (prevent SQL Injection)
$userId = mysqli_real_escape_string($con, $_POST['uid']);           // User ID
$eventCalender = mysqli_real_escape_string($con, $_POST['eventCalender']); // Calendar JSON string
$id = mysqli_real_escape_string($con, $_POST['id']);                // Dashboard record ID
$isShared = mysqli_real_escape_string($con, $_POST['isShared']);    // YES / NO
$id_Shared_Trip = mysqli_real_escape_string($con, $_POST['id_Shared_Trip']); // Shared trip ID

//  Convert isShared to lowercase for consistency
$isShared = strtolower($isShared);

//  If trip is shared, update shared trip calendar
if ($isShared === 'yes') {
    $update_sql = "
        UPDATE `dashboard`
        SET `eventCalender` = '$eventCalender'
        WHERE `id_Shared_Trip` = '$id_Shared_Trip'
    ";

    if (mysqli_query($con, $update_sql)) {
        //echo("Success to Update Shared Trip");
            echo "Success to Update Shared Trip (" . mysqli_affected_rows($con) . " rows updated)";
    } else {
        echo("Failed to Update Shared Trip: " . mysqli_error($con));
    }

//  If trip is private, update user’s personal dashboard record
} else {
    $update_sql = "
        UPDATE `dashboard`
        SET `eventCalender` = '$eventCalender'
        WHERE `id` = '$id' AND `userid` = '$userId'
    ";

    if (mysqli_query($con, $update_sql)) {
        echo("Success to Update Private Trip" .$isShared . "" .$id_Shared_Trip);
    } else {
        echo("Failed to Update Private Trip: " . mysqli_error($con));
    }
}

//  Close DB connection
mysqli_close($con);
?>

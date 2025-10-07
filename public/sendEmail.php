<?php
header("Content-Type: application/json");

$subject = $_POST['subject'] ?? '';
$message = $_POST['message'] ?? '';
$receivers = $_POST['receivers'] ?? '';

if(empty($subject) || empty($message) || empty($receivers)){
    echo json_encode(["status" => "Missing Parameters"]);
    exit();
}

$emails = explode(",", $receivers);
$success = true;

foreach($emails as $email){
    
    $sent = mail($email, $subject, $message, "From: no-reply@tripmaster.com");
    if(!$sent){
        $success = false;
    }
}

if($success){
    echo json_encode(["status" => "Emails sent successfully"]);
} else {
    echo json_encode(["status" => "Failed to send some emails"]);
}
?>

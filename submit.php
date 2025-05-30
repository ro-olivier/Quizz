<?php
// Set correct headers
header("Content-Type: application/json");

// Read incoming POST data
$data = json_decode(file_get_contents("php://input"), true);

// Validate
if (!$data || !isset($data['subject']) || !isset($data['level']) || !isset($data['score'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid input."]);
    exit;
}

// Add a timestamp
$data['timestamp'] = date('Y-m-d H:i:s');

// Store to file
$logFile = __DIR__ . "/results.json";
$existing = [];

if (file_exists($logFile)) {
    $existing = json_decode(file_get_contents($logFile), true);
    if (!is_array($existing)) {
        $existing = [];
    }
}

$existing[] = $data;

// Save it back
file_put_contents($logFile, json_encode($existing, JSON_PRETTY_PRINT));

echo json_encode(["status" => "success"]);

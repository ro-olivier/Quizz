<?php
$subject = $_GET['subject'] ?? '';
$questionDir = __DIR__ . "/data/$subject";

$levels = [];

if (is_dir($questionDir)) {
    foreach (glob("$questionDir/*.json") as $file) {
        $levels[] = basename($file, '.json');
    }
}

header('Content-Type: application/json');
echo json_encode($levels);

<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Allow from anywhere
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['token']) || empty($data['message']) || empty($data['to'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing token, to (group_id), or message']);
    exit;
}

$token = $data['token'];
$to = $data['to'];
$message = $data['message'];

$payload = [
    'to' => $to,
    'messages' => [
        [
            'type' => 'text',
            'text' => $message
        ]
    ]
];

$ch = curl_init('https://api.line.me/v2/bot/message/push');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if(curl_error($ch)) {
    http_response_code(500);
    echo json_encode(['error' => curl_error($ch)]);
} else {
    http_response_code($http_code);
    echo $result;
}
curl_close($ch);

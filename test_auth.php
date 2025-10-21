<?php
/**
 * Test Authorization Header
 * Gunakan untuk debug apakah Authorization header diterima oleh PHP
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

echo json_encode([
    'message' => 'Test Authorization Header',
    'methods_checked' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'NOT SET',
    ],
    'apache_request_headers' => function_exists('apache_request_headers') ? apache_request_headers() : 'Function not available',
    'getallheaders' => function_exists('getallheaders') ? getallheaders() : 'Function not available',
    'all_server_vars' => array_filter($_SERVER, function($key) {
        return strpos($key, 'AUTH') !== false || strpos($key, 'HTTP_') === 0;
    }, ARRAY_FILTER_USE_KEY)
], JSON_PRETTY_PRINT);

<?php

// Routeur de développement pour le serveur PHP intégré.
// Remplace `artisan serve` (dont le server.php est un faux positif Avast connu).
// Lancement : php -S 127.0.0.1:8000 dev-server.php

$publicPath = __DIR__ . '/public';
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Sert les fichiers statiques existants tels quels (assets, /storage, etc.).
if ($uri !== '/' && file_exists($publicPath . $uri)) {
    return false;
}

// Sinon, tout passe par le front controller Laravel.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = $publicPath . '/index.php';
require $publicPath . '/index.php';

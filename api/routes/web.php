<?php

use Illuminate\Support\Facades\Route;

// L'API Laravel sert aussi la PWA React compilée (frontend/dist copié dans public/).
// Toute route qui n'est pas /api/* renvoie l'index de la SPA ; le routage
// est ensuite géré côté client par React Router.
Route::get('/{any}', function () {
    $index = public_path('index.html');
    abort_unless(is_file($index), 404);

    return response()->file($index);
})->where('any', '^(?!api).*$');

<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;

// --- Public ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// --- Authentifié (Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Profil & paramètres
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/preferences', [ProfileController::class, 'updatePreferences']);
    Route::put('/password', [ProfileController::class, 'updatePassword']);
    Route::post('/logo', [ProfileController::class, 'updateLogo']);

    // Tableau de bord
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Catégories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Produits & stock
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products/{id}', [ProductController::class, 'update']); // POST pour multipart (photo)
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{id}/restore', [ProductController::class, 'restore']);
    Route::post('/products/{id}/stock-entry', [ProductController::class, 'stockEntry']);
    Route::post('/products/{id}/adjust', [ProductController::class, 'adjust']);

    // Clients & crédits
    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients', [ClientController::class, 'store']);
    Route::get('/clients/{id}', [ClientController::class, 'show']);
    Route::put('/clients/{id}', [ClientController::class, 'update']);
    Route::delete('/clients/{id}', [ClientController::class, 'destroy']);
    Route::post('/clients/{id}/payments', [ClientController::class, 'recordPayment']);

    // Ventes
    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/{id}', [SaleController::class, 'show']);
    Route::post('/sales/{id}/cancel', [SaleController::class, 'cancel']);

    // Alertes
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::get('/alerts/unread-count', [AlertController::class, 'unreadCount']);
    Route::post('/alerts/seen', [AlertController::class, 'markSeen']);

    // Journal & rapport quotidien
    Route::get('/journal', [JournalController::class, 'index']);
});

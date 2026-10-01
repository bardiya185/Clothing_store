<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// روت‌های آزاد (بدون نیاز به توکن)
Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

// روت‌های محافظت‌شده (نیاز به اکسس توکن دارن)
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

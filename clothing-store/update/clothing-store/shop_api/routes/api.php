<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

// روت‌های آزاد (بدون نیاز به توکن)
Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

// کاتالوگ عمومی فروشگاه؛ زبان با ?locale=fa|en یا هدر X-Locale انتخاب می‌شود.
Route::middleware('auth:sanctum')->post('/checkout/fake-pay', [CheckoutController::class, 'fakePay']);

// Cart state is server-owned. Guest carts use the returned baran_cart_session cookie/header.
Route::get('/cart', [CartController::class, 'show']);
Route::post('/cart/items', [CartController::class, 'store']);
Route::patch('/cart/items/{variant}', [CartController::class, 'update']);
Route::delete('/cart/items/{variant}', [CartController::class, 'destroy']);
Route::delete('/cart', [CartController::class, 'clear']);
Route::patch('/cart/discount', [CartController::class, 'discount']);

Route::prefix('catalog')->group(function () {
    Route::get('/products', [CatalogController::class, 'index']);
    Route::get('/products/{slug}', [CatalogController::class, 'show']);
    Route::get('/products/{product:slug}/reviews', [ReviewController::class, 'index']);
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/filters', [CatalogController::class, 'filters']);
    Route::get('/campaigns/active', [CampaignController::class, 'active']);
});

// روت‌های محافظت‌شده (نیاز به اکسس توکن دارن)
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::middleware('auth:sanctum')->prefix('account')->group(function () {
    Route::patch('/profile', [AccountController::class, 'updateProfile']);
    Route::get('/addresses', [AccountController::class, 'addresses']);
    Route::post('/addresses', [AccountController::class, 'createAddress']);
    Route::patch('/addresses/{address}', [AccountController::class, 'updateAddress']);
    Route::delete('/addresses/{address}', [AccountController::class, 'deleteAddress']);
    Route::get('/wishlist', [AccountController::class, 'wishlist']);
    Route::post('/wishlist/{product}', [AccountController::class, 'addToWishlist']);
    Route::delete('/wishlist/{product}', [AccountController::class, 'removeFromWishlist']);
    Route::get('/orders', [AccountController::class, 'orders']);
});

Route::middleware('auth:sanctum')->post('/catalog/products/{product:slug}/reviews', [ReviewController::class, 'store']);

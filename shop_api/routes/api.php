<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\CampaignLandingController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\Admin\CatalogController as AdminCatalogController;
use App\Http\Controllers\Api\Admin\OperationsController as AdminOperationsController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsurePermission;
use Illuminate\Support\Facades\Route;

// روت‌های آزاد (بدون نیاز به توکن)
Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

// پنل مدیریت؛ احراز هویت Sanctum، نقش فعال و permission عملیاتی الزامی است.
Route::middleware(['auth:sanctum', EnsureAdmin::class])->prefix('admin')->group(function () {
    // Identity is protected by EnsureAdmin; every data/action endpoint below
    // additionally declares its own granular permission.
    Route::get('/me', [AdminController::class, 'me']);
    Route::get('/roles', [AdminController::class, 'roles'])->middleware(EnsurePermission::class.':roles.view');
    Route::get('/users', [AdminController::class, 'users'])->middleware(EnsurePermission::class.':users.manage');
    Route::put('/users/{user}/role', [AdminController::class, 'changeRole'])->middleware([
        EnsurePermission::class.':roles.manage',
        EnsurePermission::class.':users.manage',
    ]);
    Route::put('/users/{user}/roles/{role}', [AdminController::class, 'assignRole'])->middleware([
        EnsurePermission::class.':roles.manage',
        EnsurePermission::class.':users.manage',
    ]);
    Route::delete('/users/{user}/roles/{role}', [AdminController::class, 'revokeRole'])->middleware([
        EnsurePermission::class.':roles.manage',
        EnsurePermission::class.':users.manage',
    ]);

    Route::get('/dashboard', [AdminController::class, 'dashboard'])->middleware(EnsurePermission::class.':dashboard.view');
    Route::get('/analytics', [AdminOperationsController::class, 'analytics'])->middleware(EnsurePermission::class.':analytics.view');
    Route::get('/search', [AdminOperationsController::class, 'search'])->middleware(EnsurePermission::class.':dashboard.view');
    Route::get('/notifications', [AdminOperationsController::class, 'notifications'])->middleware(EnsurePermission::class.':dashboard.view');
    Route::patch('/notifications/{notification}/read', [AdminOperationsController::class, 'markNotificationRead'])->middleware(EnsurePermission::class.':dashboard.view');
    Route::get('/audit-logs', [AdminController::class, 'auditLogs'])->middleware(EnsurePermission::class.':audit.view');

    Route::get('/products', [AdminController::class, 'products'])->middleware(EnsurePermission::class.':products.view');
    Route::post('/products', [AdminController::class, 'storeProduct'])->middleware(EnsurePermission::class.':products.create');
    Route::post('/products/images', [AdminController::class, 'uploadProductImage'])->middleware(EnsurePermission::class.':products.update');
    Route::post('/products/bulk', [AdminController::class, 'bulkStoreProducts'])->middleware(EnsurePermission::class.':products.create');
    Route::patch('/products/{product}', [AdminController::class, 'updateProduct'])->middleware(EnsurePermission::class.':products.update');
    Route::delete('/products/{product}', [AdminController::class, 'destroyProduct'])->middleware(EnsurePermission::class.':products.delete');

    Route::get('/categories', [AdminCatalogController::class, 'categories'])->middleware(EnsurePermission::class.':categories.view');
    Route::post('/categories', [AdminCatalogController::class, 'storeCategory'])->middleware(EnsurePermission::class.':categories.manage');
    Route::patch('/categories/{category}', [AdminCatalogController::class, 'updateCategory'])->middleware(EnsurePermission::class.':categories.manage');
    Route::delete('/categories/{category}', [AdminCatalogController::class, 'destroyCategory'])->middleware(EnsurePermission::class.':categories.manage');
    Route::get('/brands', [AdminCatalogController::class, 'brands'])->middleware(EnsurePermission::class.':brands.view');
    Route::post('/brands', [AdminCatalogController::class, 'storeBrand'])->middleware(EnsurePermission::class.':brands.manage');
    Route::patch('/brands/{brand}', [AdminCatalogController::class, 'updateBrand'])->middleware(EnsurePermission::class.':brands.manage');
    Route::delete('/brands/{brand}', [AdminCatalogController::class, 'destroyBrand'])->middleware(EnsurePermission::class.':brands.manage');
    Route::get('/collections', [AdminCatalogController::class, 'collections'])->middleware(EnsurePermission::class.':collections.view');
    Route::post('/collections', [AdminCatalogController::class, 'storeCollection'])->middleware(EnsurePermission::class.':collections.manage');
    Route::patch('/collections/{collection}', [AdminCatalogController::class, 'updateCollection'])->middleware(EnsurePermission::class.':collections.manage');
    Route::delete('/collections/{collection}', [AdminCatalogController::class, 'destroyCollection'])->middleware(EnsurePermission::class.':collections.manage');
    Route::get('/attributes', [AdminController::class, 'attributes'])->middleware(EnsurePermission::class.':products.view');

    Route::get('/inventory/movements', [AdminOperationsController::class, 'inventory'])->middleware(EnsurePermission::class.':inventory.view');
    Route::post('/inventory/adjust', [AdminOperationsController::class, 'adjustInventory'])->middleware(EnsurePermission::class.':inventory.adjust');

    Route::get('/payments', [AdminOperationsController::class, 'payments'])->middleware(EnsurePermission::class.':fulfillment.view');
    Route::get('/shipping-methods', [AdminOperationsController::class, 'shippingMethods'])->middleware(EnsurePermission::class.':fulfillment.view');
    Route::post('/shipping-methods', [AdminOperationsController::class, 'storeShippingMethod'])->middleware(EnsurePermission::class.':fulfillment.update');
    Route::patch('/shipping-methods/{method}', [AdminOperationsController::class, 'updateShippingMethod'])->middleware(EnsurePermission::class.':fulfillment.update');
    Route::delete('/shipping-methods/{method}', [AdminOperationsController::class, 'destroyShippingMethod'])->middleware(EnsurePermission::class.':fulfillment.update');
    Route::get('/shipments', [AdminOperationsController::class, 'shipments'])->middleware(EnsurePermission::class.':fulfillment.view');
    Route::patch('/shipments/{shipment}', [AdminOperationsController::class, 'updateShipment'])->middleware(EnsurePermission::class.':fulfillment.update');
    Route::get('/returns', [AdminOperationsController::class, 'returns'])->middleware(EnsurePermission::class.':fulfillment.view');
    Route::patch('/returns/{return}', [AdminOperationsController::class, 'updateReturn'])->middleware(EnsurePermission::class.':fulfillment.update');
    Route::get('/refunds', [AdminOperationsController::class, 'refunds'])->middleware(EnsurePermission::class.':fulfillment.view');
    Route::post('/returns/{return}/refund', [AdminOperationsController::class, 'createRefund'])->middleware(EnsurePermission::class.':fulfillment.update');
    Route::patch('/refunds/{refund}', [AdminOperationsController::class, 'updateRefund'])->middleware(EnsurePermission::class.':fulfillment.update');

    Route::get('/orders', [AdminController::class, 'orders'])->middleware(EnsurePermission::class.':orders.view');
    Route::get('/orders/{order}', [AdminController::class, 'orderDetail'])->middleware(EnsurePermission::class.':orders.view');
    Route::patch('/orders/{order}', [AdminController::class, 'updateOrder'])->middleware(EnsurePermission::class.':orders.update');
    Route::get('/carts/abandoned', [AdminController::class, 'abandonedCarts'])->middleware(EnsurePermission::class.':orders.view');
    Route::post('/carts/{cart}/recovery', [AdminController::class, 'remindCart'])->middleware(EnsurePermission::class.':orders.update');

    Route::get('/customers', [AdminController::class, 'customers'])->middleware(EnsurePermission::class.':customers.view');
    Route::get('/customers/{user}', [AdminController::class, 'customerDetail'])->middleware(EnsurePermission::class.':customers.view');
    Route::get('/customers/{user}/orders', [AdminController::class, 'customerOrders'])->middleware(EnsurePermission::class.':customers.view');

    Route::get('/reviews', [AdminController::class, 'reviews'])->middleware(EnsurePermission::class.':reviews.view');
    Route::patch('/reviews/bulk', [AdminController::class, 'bulkUpdateReviews'])->middleware(EnsurePermission::class.':reviews.moderate');
    Route::patch('/reviews/{review}', [AdminController::class, 'updateReview'])->middleware(EnsurePermission::class.':reviews.moderate');
    Route::delete('/reviews/{review}', [AdminController::class, 'destroyReview'])->middleware(EnsurePermission::class.':reviews.delete');

    Route::get('/campaigns', [AdminController::class, 'campaigns'])->middleware(EnsurePermission::class.':campaigns.view');
    Route::post('/campaigns', [AdminController::class, 'storeCampaign'])->middleware(EnsurePermission::class.':campaigns.create');
    Route::patch('/campaigns/{campaign}', [AdminController::class, 'updateCampaign'])->middleware(EnsurePermission::class.':campaigns.update');
    Route::delete('/campaigns/{campaign}', [AdminController::class, 'destroyCampaign'])->middleware(EnsurePermission::class.':campaigns.delete');
    Route::get('/discounts', [AdminController::class, 'discounts'])->middleware(EnsurePermission::class.':discounts.view');
    Route::post('/discounts', [AdminController::class, 'storeDiscount'])->middleware(EnsurePermission::class.':discounts.create');
    Route::patch('/discounts/{discountCode}', [AdminController::class, 'updateDiscount'])->middleware(EnsurePermission::class.':discounts.update');
    Route::delete('/discounts/{discountCode}', [AdminController::class, 'destroyDiscount'])->middleware(EnsurePermission::class.':discounts.delete');
    Route::get('/homepage-sections', [AdminOperationsController::class, 'homepageSections'])->middleware(EnsurePermission::class.':homepage.view');
    Route::post('/homepage-sections', [AdminOperationsController::class, 'storeHomepageSection'])->middleware(EnsurePermission::class.':homepage.create');
    Route::patch('/homepage-sections/{section}', [AdminOperationsController::class, 'updateHomepageSection'])->middleware(EnsurePermission::class.':homepage.update');
    Route::delete('/homepage-sections/{section}', [AdminOperationsController::class, 'destroyHomepageSection'])->middleware(EnsurePermission::class.':homepage.delete');
    Route::get('/banners', [AdminController::class, 'banners'])->middleware(EnsurePermission::class.':banners.view');
    Route::post('/banners', [AdminController::class, 'storeBanner'])->middleware(EnsurePermission::class.':banners.create');
    Route::patch('/banners/{banner}', [AdminController::class, 'updateBanner'])->middleware(EnsurePermission::class.':banners.update');
    Route::delete('/banners/{banner}', [AdminController::class, 'destroyBanner'])->middleware(EnsurePermission::class.':banners.delete');
    Route::get('/campaigns/{campaign}/landing', [AdminController::class, 'landing'])->middleware(EnsurePermission::class.':campaigns.view');
    Route::put('/campaigns/{campaign}/landing', [AdminController::class, 'updateLanding'])->middleware(EnsurePermission::class.':campaigns.update');
});

// پرداخت فیک فقط برای کاربر واردشده انجام می‌شود.
Route::middleware('auth:sanctum')->post('/checkout/fake-pay', [CheckoutController::class, 'fakePay']);

// Cart state is server-owned. Guest carts use the returned baran_cart_session cookie/header.
Route::get('/cart', [CartController::class, 'show']);
Route::get('/cart/recover/{token}', [CartController::class, 'recover']);
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
    Route::get('/banners', [BannerController::class, 'index']);
    Route::get('/campaigns/active', [CampaignController::class, 'active']);
    Route::post('/campaigns/{campaign:slug}/events', [CampaignController::class, 'trackEvent']);
    Route::get('/campaigns/{slug}/landing', [CampaignLandingController::class, 'show']);
});

// روت‌های محافظت‌شده حساب کاربری
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

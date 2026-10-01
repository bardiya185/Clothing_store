<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\AuthResource;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * ارسال کد OTP
     */
    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $result = $this->authService->sendOtp($request->validated('phone'));

        return response()->json([
            'status'  => 'success',
            'message' => __('auth.otp_sent'),
            'data'    => $result,
        ]);
    }

    /**
     * تأیید OTP و ورود / ثبت نام (استفاده از AuthResource)
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $result = $this->authService->verifyOtp(
            $request->validated('phone'),
            $request->validated('code')
        );

        return response()->json([
            'status'  => 'success',
            'message' => $result['message'], // پیام ترجمه‌شده ثبت‌نام یا ورود
            'data'    => new AuthResource($result), // 👈 استفاده از AuthResource
        ]);
    }

    /**
     * رفرش توکن و دریافت توکن جدید (استفاده از AuthResource)
     */
    public function refresh(RefreshTokenRequest $request): JsonResponse
    {
        $result = $this->authService->refreshToken($request->validated('refresh_token'));

        return response()->json([
            'status'  => 'success',
            'message' => __('auth.token_refreshed'), // 👈 پیام ترجمه‌شده از فایل زبان
            'data'    => new AuthResource($result),  // 👈 استفاده از AuthResource
        ]);
    }

    /**
     * دریافت اطلاعات پروفایل خود کاربر با Resource
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data'   => new UserResource($request->user()), // 👈 ریسورس تک‌کاربره
        ]);
    }

    /**
     * خروج از سیستم
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'status'  => 'success',
            'message' => __('auth.logout_success'),
        ]);
    }
}

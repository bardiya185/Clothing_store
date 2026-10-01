<?php

namespace App\Services;

use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    /**
     * ارسال کد OTP
     */
    public function sendOtp(string $phone): array
    {
        // ۱. چک کردن Rate Limit (محدودیت ۲ دقیقه‌ای)
        $hasRecentOtp = OtpCode::where('phone', $phone)
            ->where('created_at', '>', now()->subMinutes(2))
            ->where('used', false)
            ->exists();

        if ($hasRecentOtp) {
            throw ValidationException::withMessages([
                'phone' => [__('auth.otp_rate_limit')], // 👈 کلید فایل زبان تو
            ]);
        }

        // ۲. تولید کد
        $code = (string) random_int(100000, 999999);

        // ۳. ذخیره در دیتابیس
        DB::transaction(function () use ($phone, $code) {
            OtpCode::where('phone', $phone)
                ->where('used', false)
                ->update(['used' => true]);

            OtpCode::create([
                'phone'      => $phone,
                'code'       => $code,
                'expires_at' => now()->addMinutes(5),
            ]);
        });

        // ۴. ارسال پیامک
        $this->sendSms($phone, $code);

        return [
            'sent' => true,
            'code' => app()->isLocal() ? $code : null,
            'time' => now()
        ];
    }

    /**
     * تایید OTP و ورود یا ثبت‌نام
     */
    public function verifyOtp(string $phone, string $code): array
    {
        // چک کردن وجود کد برای این شماره
        $otpExists = OtpCode::where('phone', $phone)->where('used', false)->exists();
        if (!$otpExists) {
            throw ValidationException::withMessages([
                'code' => [__('auth.code_not_found')], // 👈 کلید فایل زبان تو
            ]);
        }

        // چک کردن انقضای کد
        $otp = OtpCode::where('phone', $phone)
            ->where('code', $code)
            ->where('used', false)
            ->first();

        if (!$otp) {
            throw ValidationException::withMessages([
                'code' => [__('auth.code_wrong')], // 👈 کلید فایل زبان تو
            ]);
        }

        if ($otp->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => [__('auth.code_expired')], // 👈 کلید فایل زبان تو
            ]);
        }

        // علامت‌گذاری به عنوان استفاده‌شده
        $otp->update(['used' => true]);

        // ساخت یا یافتن کاربر
        $isNewUser = !User::where('phone', $phone)->exists();

        $user = User::firstOrCreate(
            ['phone' => $phone],
            ['phone_verified_at' => now()]
        );

        if (!$user->phone_verified_at) {
            $user->update(['phone_verified_at' => now()]);
        }

        // تولید توکن‌ها
        $tokens = $this->generateTokens($user);



        return [
            'user'       => $user,
            'tokens'     => $tokens,
            'is_new'     => $isNewUser,
            'message'    => $isNewUser ? __('auth.register_success') : __('auth.login_success'), // 👈 پیام متناسب با لاگین یا ثبت‌نام
        ];

    }

    /**
     * رفرش توکن
     */
    public function refreshToken(string $plainRefreshToken): array
    {
        $tokenParts = explode('|', $plainRefreshToken, 2);

        if (count($tokenParts) !== 2) {
            throw ValidationException::withMessages([
                'refresh_token' => [__('auth.code_invalid')],
            ]);
        }

        /** @var PersonalAccessToken|null $tokenModel */
        $tokenModel = PersonalAccessToken::find($tokenParts[0]);

        if (
            !$tokenModel ||
            !$tokenModel->can('refresh') ||
            ($tokenModel->expires_at && $tokenModel->expires_at->isPast())
        ) {
            throw ValidationException::withMessages([
                'refresh_token' => [__('auth.unauthorized')], // 👈 کلید فایل زبان تو
            ]);
        }

        $user = $tokenModel->tokenable;
        $tokenModel->delete();

        return $this->generateTokens($user);
    }

    /**
     * خروج از دستگاه فعلی
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * خروج از همه دستگاه‌ها
     */
    public function logoutAllDevices(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * ساخت توکن‌ها
     */
    private function generateTokens(User $user): array
    {
        $accessToken = $user->createToken(
            'access_token',
            ['*'],
            now()->addMinutes(15)
        )->plainTextToken;

        $refreshToken = $user->createToken(
            'refresh_token',
            ['refresh'],
            now()->addDays(30)
        )->plainTextToken;

        return [
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'Bearer',
            'expires_in'    => 15 * 60,
        ];
    }

    /**
     * ارسال SMS با استفاده از متن پترن در فایل زبان
     */
    private function sendSms(string $phone, string $code): void
    {
        // استفاده از کلید otp_message همراه با پاس دادن متغیر code:
        $message = __('auth.otp_message', ['code' => $code]);

        logger("SMS to {$phone}: {$message}");
    }
}

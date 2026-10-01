<?php

namespace App\Services;

use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
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
        // The lock makes the rate-limit check and insert one atomic operation.
        $code = Cache::lock("otp-send:{$phone}", 10)->block(5, function () use ($phone): string {
            return DB::transaction(function () use ($phone): string {
                $hasRecentOtp = OtpCode::where('phone', $phone)
                    ->where('created_at', '>', now()->subMinutes(2))
                    ->where('used', false)
                    ->lockForUpdate()
                    ->exists();

                if ($hasRecentOtp) {
                    throw ValidationException::withMessages([
                        'phone' => [__('auth.otp_rate_limit')],
                    ]);
                }

                $code = (string) random_int(100000, 999999);
                OtpCode::where('phone', $phone)
                    ->where('used', false)
                    ->update(['used' => true]);

                OtpCode::create([
                    'phone' => $phone,
                    'code' => $code,
                    'expires_at' => now()->addMinutes(5),
                ]);

                return $code;
            });
        });

        $this->sendSms($phone, $code);

        return [
            'sent' => true,
            'code' => app()->isLocal() ? $code : null,
            'time' => now(),
        ];
    }

    /**
     * تایید OTP و ورود یا ثبت‌نام
     */
    public function verifyOtp(string $phone, string $code): array
    {
        return DB::transaction(function () use ($phone, $code): array {
            // Lock the OTP row so two simultaneous verification requests cannot both consume it.
            $otp = OtpCode::where('phone', $phone)
                ->where('used', false)
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (!$otp) {
                throw ValidationException::withMessages([
                    'code' => [__('auth.code_not_found')],
                ]);
            }

            if ((string) $otp->code !== $code) {
                throw ValidationException::withMessages([
                    'code' => [__('auth.code_wrong')],
                ]);
            }

            if ($otp->expires_at->isPast()) {
                throw ValidationException::withMessages([
                    'code' => [__('auth.code_expired')],
                ]);
            }

            $otp->update(['used' => true]);
            $isNewUser = !User::where('phone', $phone)->exists();
            $user = User::firstOrCreate(['phone' => $phone], ['phone_verified_at' => now()]);

            if (!$user->phone_verified_at) {
                $user->update(['phone_verified_at' => now()]);
            }

            return [
                'user' => $user->fresh(),
                'tokens' => $this->generateTokens($user),
                'is_new' => $isNewUser,
                'message' => $isNewUser ? __('auth.register_success') : __('auth.login_success'),
            ];
        });
    }

    /**
     * رفرش توکن
     */
    public function refreshToken(string $plainRefreshToken): array
    {
        // 👈 استفاده از متد رسمی Sanctum برای یافتن توکن
        /** @var PersonalAccessToken|null $tokenModel */
        $tokenModel = PersonalAccessToken::findToken($plainRefreshToken);

        if (
            !$tokenModel ||
            !$tokenModel->can('refresh') ||
            ($tokenModel->expires_at && $tokenModel->expires_at->isPast())
        ) {
            throw ValidationException::withMessages([
                'refresh_token' => [__('auth.unauthorized')],
            ]);
        }

        $user = $tokenModel->tokenable;
        
        // ابطال رفرش توکن قدیمی (یک‌بار مصرف بودن)
        $tokenModel->delete();

        return [
            'user'   => $user,
            'tokens' => $this->generateTokens($user),
        ];
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

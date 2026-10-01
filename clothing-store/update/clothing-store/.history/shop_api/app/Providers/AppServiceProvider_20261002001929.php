<?php

namespace App\Providers;

use App\Contracts\SmsServiceInterface;
use App\Services\Sms\LogSmsService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            SmsServiceInterface::class,
            LogSmsService::class
        );
    }

    public function boot(): void
    {
        RateLimiter::for('global', function (Request $request) {
            return Limit::perMinute(100)->by($request->ip()) ->response(function (Request $request, array $headers) {
                $seconds = (int) ($headers['Retry-After'] ?? 60);

                return response()->json([
                    'message' => __('ratelimite.RateLimiting_Error', [
                        'seconds' => $seconds,
                    ]),
                    'retry_after' => $seconds,
                ], 429, $headers);
            });
        });
}
 }

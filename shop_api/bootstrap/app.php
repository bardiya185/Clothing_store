<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use App\Http\Middleware\SetLocale;
use Illuminate\Queue\Middleware\RateLimited;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([__DIR__.'/../app/Console/Commands'])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(append: [SetLocale::class, 'throttle:global']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (Throwable $exception, Request $request) {
            if (!$request->is('api/*')) return null;

            $status = $exception instanceof AuthenticationException ? 401
                : ($exception instanceof ModelNotFoundException ? 404
                    : ($exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : 500));
            if (!in_array($status, [401, 403, 404, 409, 429], true)) return null;

            $key = match ($status) {
                401 => 'unauthorized',
                403 => 'forbidden',
                404 => 'not_found',
                409 => 'conflict',
                429 => 'too_many_requests',
            };

            return response()->json([
                'status' => 'error',
                'message' => trans("errors.{$key}"),
                'code' => $status,
            ], $status);
        });
    })->create();

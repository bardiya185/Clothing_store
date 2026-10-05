<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!$request->user('sanctum')?->hasPermission($permission)) {
            return response()->json([
                'status' => 'error',
                'message' => __('admin.forbidden'),
            ], 403);
        }

        return $next($request);
    }
}

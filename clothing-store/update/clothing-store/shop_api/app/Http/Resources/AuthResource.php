<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    /**
     * تبدیل خروجی توکن‌ها به همراه ریسورس کاربر
     */
    public function toArray(Request $request): array
    {
        $payload = is_array($this->resource) ? $this->resource : [];
        $tokens = is_array($payload['tokens'] ?? null) ? $payload['tokens'] : [];

        return [
            // The refresh endpoint may return tokens without a user payload.
            // Keep the field nullable instead of triggering "Undefined array key user".
            'user' => isset($payload['user']) ? new UserResource($payload['user']) : null,
            'tokens' => [
                'access_token'  => $tokens['access_token'] ?? null,
                'refresh_token' => $tokens['refresh_token'] ?? null,
                'token_type'    => $tokens['token_type'] ?? 'Bearer',
                'expires_in'    => $tokens['expires_in'] ?? null,
            ],
        ];
    }
}

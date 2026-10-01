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
        return [
           'user' => $user ? new UserResource($user) : null,
            'tokens' => [
                'access_token'  => $this['tokens']['access_token'],
                'refresh_token' => $this['tokens']['refresh_token'],
                'token_type'    => $this['tokens']['token_type'],
                'expires_in'    => $this['tokens']['expires_in'], // ثانیه
            ],
        ];
    }
}

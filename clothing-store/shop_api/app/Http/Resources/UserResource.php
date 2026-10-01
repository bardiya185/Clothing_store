<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * تبدیل مدل User به آرایه قابل نمایش در API
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name ?? __('auth.unnamed_user'),
            'phone'       => $this->phone,
            'is_verified' => !is_null($this->phone_verified_at),
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}

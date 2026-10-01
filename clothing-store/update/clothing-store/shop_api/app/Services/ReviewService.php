<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public function listApproved(Product $product): Collection
    {
        return $product->reviews()
            ->where('status', 'approved')
            ->with('user:id,name')
            ->latest()
            ->get();
    }

    public function create(User $user, Product $product, array $data): ProductReview
    {
        if ($product->reviews()->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'body' => [__('reviews.already_reviewed')],
            ]);
        }

        return $product->reviews()->create([
            ...$data,
            'user_id' => $user->id,
            'status' => 'approved',
        ])->load('user:id,name');
    }
}

<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AccountService
{
    public function updateProfile(User $user, array $data): User
    {
        $user->update($data);
        return $user->refresh();
    }

    public function wishlist(User $user): Collection
    {
        return $user->wishlists()
            ->with(['product.translations', 'product.category.translations', 'product.images.translations', 'product.variants'])
            ->latest()
            ->get()
            ->pluck('product')
            ->filter()
            ->values();
    }

    public function addToWishlist(User $user, Product $product): void
    {
        // The unique database index plus insertOrIgnore makes this idempotent under concurrent clicks.
        DB::table('wishlists')->insertOrIgnore([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function removeFromWishlist(User $user, Product $product): void
    {
        $user->wishlists()->where('product_id', $product->id)->delete();
    }

    public function addresses(User $user): Collection
    {
        return $user->addresses()->latest()->get();
    }

    public function createAddress(User $user, array $data): Address
    {
        return DB::transaction(function () use ($user, $data): Address {
            if ($data['is_default'] ?? false) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create($data);
        });
    }

    public function updateAddress(User $user, Address $address, array $data): Address
    {
        return DB::transaction(function () use ($user, $address, $data): Address {
            if ($data['is_default'] ?? false) {
                $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            $address->update($data);
            return $address->refresh();
        });
    }

    public function deleteAddress(User $user, Address $address): void
    {
        $user->addresses()->whereKey($address->id)->delete();
    }

    public function orders(User $user): LengthAwarePaginator
    {
        return Order::query()
            ->where('user_id', $user->id)
            ->with('items')
            ->latest()
            ->paginate(10);
    }
}

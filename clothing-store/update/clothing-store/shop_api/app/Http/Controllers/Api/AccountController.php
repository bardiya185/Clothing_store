<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\AddressRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Http\Resources\ProductResource;
use App\Http\Resources\UserResource;
use App\Models\Address;
use App\Models\Product;
use App\Services\AccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(private readonly AccountService $account) {}

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->account->updateProfile($request->user(), $request->validated());
        return response()->json(['status' => 'success', 'message' => __('account.profile_updated'), 'data' => new UserResource($user)]);
    }

    public function wishlist(Request $request): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => ProductResource::collection($this->account->wishlist($request->user()))]);
    }

    public function addToWishlist(Request $request, Product $product): JsonResponse
    {
        $this->account->addToWishlist($request->user(), $product);
        return response()->json(['status' => 'success', 'message' => __('account.wishlist_added')], 201);
    }

    public function removeFromWishlist(Request $request, Product $product): JsonResponse
    {
        $this->account->removeFromWishlist($request->user(), $product);
        return response()->json(['status' => 'success', 'message' => __('account.wishlist_removed')]);
    }

    public function addresses(Request $request): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => $this->account->addresses($request->user())]);
    }

    public function createAddress(AddressRequest $request): JsonResponse
    {
        $address = $this->account->createAddress($request->user(), $request->validated());
        return response()->json(['status' => 'success', 'message' => __('account.address_created'), 'data' => $address], 201);
    }

    public function updateAddress(AddressRequest $request, Address $address): JsonResponse
    {
        abort_unless($address->user_id === $request->user()->id, 404);
        $address = $this->account->updateAddress($request->user(), $address, $request->validated());
        return response()->json(['status' => 'success', 'message' => __('account.address_updated'), 'data' => $address]);
    }

    public function deleteAddress(Request $request, Address $address): JsonResponse
    {
        abort_unless($address->user_id === $request->user()->id, 404);
        $this->account->deleteAddress($request->user(), $address);
        return response()->json(['status' => 'success', 'message' => __('account.address_deleted')]);
    }

    public function orders(Request $request): JsonResponse
    {
        $orders = $this->account->orders($request->user());
        return response()->json([
            'status' => 'success',
            'data' => $orders->through(fn ($order) => [
                'id' => $order->id,
                'number' => $order->number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'postal_status' => $order->postal_status,
                'postal_tracking_code' => $order->postal_tracking_code,
                'currency' => $order->currency_code,
                'total_toman' => (int) $order->total_toman,
                'total_usd' => (float) $order->total_usd,
                'items_count' => $order->items->sum('quantity'),
                'created_at' => $order->created_at?->toIso8601String(),
            ]),
        ]);
    }
}

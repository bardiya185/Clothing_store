<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Models\Product;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $reviews) {}

    public function index(Product $product): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->reviews->listApproved($product)->map(fn ($review) => [
                'id' => $review->id,
                'rating' => (int) $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'author' => $review->user?->name ?: __('auth.unnamed_user'),
                'created_at' => $review->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function store(StoreReviewRequest $request, Product $product): JsonResponse
    {
        $review = $this->reviews->create($request->user(), $product, $request->validated());

        return response()->json([
            'status' => 'success',
            'message' => __('reviews.created'),
            'data' => [
                'id' => $review->id,
                'rating' => (int) $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'author' => $review->user?->name ?: __('auth.unnamed_user'),
                'created_at' => $review->created_at?->toIso8601String(),
            ],
        ], 201);
    }
}

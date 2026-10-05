<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\Attribute;
use App\Models\Banner;
use App\Mail\AbandonedCartReminder;
use App\Models\Campaign;
use App\Models\CampaignEvent;
use App\Models\Cart;
use App\Models\Category;
use App\Models\DiscountCode;
use App\Models\Order;
use App\Models\Locale;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\ProductSlugRedirect;
use App\Models\Permission;
use App\Models\ProductReview;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'phone' => $request->user()->phone,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
                'roles' => $request->user()->getRoleNames()->values(),
                'permissions' => $request->user()->isAdmin()
                    ? Permission::query()->where('guard_name', 'web')->pluck('name')->values()
                    : $request->user()->getAllPermissions()->pluck('name')->values(),
            ],
        ]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::query()->with('permissions')->withCount('users')->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $roles->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $role->label ?? $role->name,
                'is_active' => (bool) $role->is_active,
                'users_count' => (int) $role->users_count,
                'permissions' => $role->permissions->pluck('name')->values(),
            ])->values(),
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::query()->with(['roles:id,name,label'])->latest();
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($builder) => $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }
        $users = $query->paginate(min((int) $request->query('per_page', 100), 100));

        return response()->json([
            'status' => 'success',
            'data' => $users->getCollection()->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name ?: '—',
                'phone' => $user->phone,
                'email' => $user->email,
                'roles' => $user->roles->map(fn (Role $role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => $role->label,
                ])->values(),
                'created_at' => $user->created_at?->toIso8601String(),
            ])->values(),
            'meta' => ['current_page' => $users->currentPage(), 'last_page' => $users->lastPage(), 'total' => $users->total()],
        ]);
    }

    public function changeRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['role_id' => ['required', 'integer', 'exists:roles,id']]);
        $role = Role::query()->findOrFail($data['role_id']);
        abort_if(!$role->is_active, 422, __('admin.role_inactive'));

        $previousRoles = $user->getRoleNames()->values()->all();
        $user->syncRoles([$role]);
        $this->audit('role.changed', $user, ['from' => $previousRoles, 'to' => [$role->name]]);

        return response()->json([
            'status' => 'success',
            'message' => __('admin.role_assigned'),
            'data' => ['user_id' => $user->id, 'roles' => $user->fresh()->getRoleNames()->values()],
        ]);
    }

    public function assignRole(User $user, Role $role): JsonResponse
    {
        abort_if(!$role->is_active, 422, __('admin.role_inactive'));
        $user->assignRole($role);
        $this->audit('role.assigned', $user, ['role' => $role->name]);

        return response()->json(['status' => 'success', 'message' => __('admin.role_assigned')]);
    }

    public function revokeRole(User $user, Role $role): JsonResponse
    {
        $user->removeRole($role);
        $this->audit('role.revoked', $user, ['role' => $role->name]);

        return response()->json(['status' => 'success', 'message' => __('admin.role_revoked')]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $query = AdminAuditLog::query()->with('user:id,name,phone')->latest();
        if ($action = trim((string) $request->query('action'))) {
            $query->where('action', 'like', "%{$action}%");
        }
        if ($request->filled('date_from')) $query->whereDate('created_at', '>=', $request->query('date_from'));
        if ($request->filled('date_to')) $query->whereDate('created_at', '<=', $request->query('date_to'));
        $logs = $query->paginate(min((int) $request->query('per_page', 30), 100));

        return response()->json([
            'status' => 'success',
            'data' => $logs->getCollection()->map(fn (AdminAuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'auditable_type' => class_basename((string) $log->auditable_type),
                'auditable_id' => $log->auditable_id,
                'metadata' => $log->metadata ?? [],
                'actor' => $log->user ? ['name' => $log->user->name, 'phone' => $log->user->phone] : null,
                'created_at' => $log->created_at?->toIso8601String(),
            ])->values(),
            'meta' => ['current_page' => $logs->currentPage(), 'last_page' => $logs->lastPage(), 'total' => $logs->total()],
        ]);
    }

    public function dashboard(): JsonResponse
    {
        $paidStatuses = ['paid', 'processing', 'shipped', 'completed'];
        $revenue = (int) Order::query()->whereIn('status', $paidStatuses)->sum('total_toman');
        $lastSevenDays = collect(range(6, 0))->map(function (int $daysAgo) use ($paidStatuses): array {
            $date = now()->subDays($daysAgo)->startOfDay();
            return [
                'date' => $date->toDateString(),
                'label' => $date->format('m/d'),
                'orders' => Order::query()->whereDate('created_at', $date)->count(),
                'revenue_toman' => (int) Order::query()
                    ->whereDate('created_at', $date)
                    ->whereIn('status', $paidStatuses)
                    ->sum('total_toman'),
            ];
        })->values();

        $recentOrders = Order::query()
            ->with('user:id,name,phone')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Order $order) => $this->orderSummary($order));

        $topSelling = Product::query()
            ->with('translations')
            ->withSum('orderItems', 'quantity')
            ->orderByDesc('order_items_sum_quantity')
            ->limit(5)
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name_fa' => $this->translation($product->translations, 'fa') ?? $product->slug,
                'name_en' => $this->translation($product->translations, 'fa') ?? $product->slug,
                'sold_quantity' => (int) ($product->order_items_sum_quantity ?? 0),
            ]);

        $lowStock = ProductVariant::query()
            ->with(['product.translations'])
            ->where('is_active', true)
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->orderBy('stock')
            ->limit(8)
            ->get()
            ->map(fn (ProductVariant $variant) => [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'stock' => (int) $variant->stock,
                'threshold' => (int) $variant->low_stock_threshold,
                'product' => $this->translation($variant->product?->translations, 'fa')
                    ?? $this->translation($variant->product?->translations, 'fa')
                    ?? $variant->product?->slug,
            ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'metrics' => [
                    'revenue_toman' => $revenue,
                    'orders' => Order::count(),
                    'customers' => User::query()->where('role', 'customer')->count(),
                    'products' => Product::count(),
                    'published_products' => Product::query()->where('status', 'published')->count(),
                    'pending_orders' => Order::query()->whereIn('status', ['pending', 'paid', 'processing'])->count(),
                    'pending_reviews' => ProductReview::query()->where('status', 'pending')->count(),
                    'abandoned_carts' => Cart::query()->where('status', 'active')->where('updated_at', '<', now()->subHours(2))->whereHas('items')->count(),
                ],
                'sales' => $lastSevenDays,
                'recent_orders' => $recentOrders,
                'top_selling' => $topSelling,
                'low_stock' => $lowStock,
            ],
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with(['category.translations', 'brand.translations', 'translations', 'variants.attributeValues', 'images'])
            ->withSum('orderItems', 'quantity');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('slug', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhereHas('translations', fn ($translations) => $translations->where('name', 'like', "%{$search}%"));
            });
        }
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        if ($request->filled('category_id')) $query->where('category_id', $request->query('category_id'));
        $sort = (string) $request->query('sort', 'created_at');
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';
        $query->orderBy(in_array($sort, ['created_at', 'sort_order', 'sku', 'status'], true) ? $sort : 'created_at', $direction);

        $products = $query->paginate(min((int) $request->query('per_page', 15), 50));

        return response()->json([
            'status' => 'success',
            'data' => $products->getCollection()->map(fn (Product $product) => $this->productSummary($product))->values(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function attributes(): JsonResponse
    {
        $attributes = Attribute::query()->with(['translations', 'values.translations'])->orderBy('sort_order')->get();

        return response()->json([
            'status' => 'success',
            'data' => $attributes->map(fn (Attribute $attribute) => [
                'id' => $attribute->id,
                'slug' => $attribute->slug,
                'type' => $attribute->type,
                'name_fa' => $this->translation($attribute->translations, 'fa') ?? $attribute->slug,
                'name_en' => $this->translation($attribute->translations, 'fa') ?? $attribute->slug,
                'values' => $attribute->values->map(fn ($value) => [
                    'id' => $value->id,
                    'slug' => $value->slug,
                    'color' => $value->color_hex,
                    'name_fa' => $this->translation($value->translations, 'fa') ?? $value->slug,
                    'name_en' => $this->translation($value->translations, 'fa') ?? $value->slug,
                ])->values(),
            ])->values(),
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::query()->with('translations')->withCount('products')->orderBy('sort_order')->get();
        return response()->json([
            'status' => 'success',
            'data' => $categories->map(fn (Category $category) => [
                'id' => $category->id,
                'slug' => $category->slug,
                'name_fa' => $this->translation($category->translations, 'fa') ?? $category->slug,
                'name_en' => $this->translation($category->translations, 'fa') ?? $category->slug,
                'products_count' => $category->products_count,
            ]),
        ]);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $this->normalizeProductSlug($request);
        $this->normalizeProductSku($request);
        $data = $request->validate($this->productRules());
        $product = DB::transaction(fn (): Product => $this->createProductRecord($data));

        $this->audit('product.created', $product);
        return response()->json(['status' => 'success', 'message' => __('admin.product_created'), 'data' => $this->productSummary($product->load(['translations', 'variants.attributeValues', 'images', 'category.translations', 'brand.translations']))], 201);
    }

    public function uploadProductImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120'],
        ]);
        $path = $request->file('image')->store('products', 'public');

        return response()->json([
            'status' => 'success',
            'message' => __('admin.image_uploaded'),
            'data' => ['path' => '/storage/'.ltrim($path, '/')],
        ], 201);
    }

    public function bulkStoreProducts(Request $request): JsonResponse
    {
        $rows = $request->validate([
            'products' => ['required', 'array', 'min:1', 'max:200'],
        ])['products'];

        $products = DB::transaction(function () use ($rows): array {
            return collect($rows)->map(function (array $row, int $index): Product {
                $row['slug'] = $this->normalizedSlug($row['slug'] ?? '', 'product');
                $row['sku'] = $this->normalizedSku((string) ($row['sku'] ?? '')) ?: $this->generateSku($row['name_en'] ?? $row['name_fa'] ?? 'product');
                $row['variant_sku'] = $this->normalizedSku((string) ($row['variant_sku'] ?? '')) ?: $this->uniqueVariantSku($row['sku'].'-DEFAULT');
                if (isset($row['variants']) && is_array($row['variants'])) {
                    $row['variants'] = array_map(fn (array $variant): array => [
                        ...$variant,
                        'sku' => $this->normalizedSku((string) ($variant['sku'] ?? '')) ?: $this->uniqueVariantSku($row['sku'].'-'.Str::upper(Str::random(5))),
                    ], $row['variants']);
                }
                $validator = Validator::make($row, $this->productRules());
                if ($validator->fails()) {
                    $validator->errors()->add('row', $index + 2);
                    $validator->validate();
                }

                return $this->createProductRecord($validator->validated());
            })->all();
        });

        foreach ($products as $product) {
            $this->audit('product.created.bulk', $product);
        }

        return response()->json([
            'status' => 'success',
            'message' => __('admin.products_imported', ['count' => count($products)]),
            'data' => ['imported' => count($products)],
        ], 201);
    }

    public function updateProduct(Request $request, Product $product): JsonResponse
    {
        $this->normalizeProductSlug($request);
        $this->normalizeProductSku($request, $product);
        $data = $request->validate($this->productRules($product));
        DB::transaction(function () use ($data, $product): void {
            $oldSlug = $product->slug;
            $product->update([
                'category_id' => $data['category_id'] ?? null,
                'brand_id' => $data['brand_id'] ?? null,
                'slug' => $data['slug'],
                'sku' => $data['sku'],
                'gender' => $data['gender'],
                'status' => $data['status'],
                'is_featured' => $data['is_featured'] ?? false,
                'is_new' => $data['is_new'] ?? false,
                'sort_order' => $data['sort_order'] ?? 0,
            ]);
            if ($oldSlug !== $product->slug) {
                ProductSlugRedirect::updateOrCreate(
                    ['old_slug' => $oldSlug],
                    ['product_id' => $product->id, 'new_slug' => $product->slug, 'status_code' => 301],
                );
            }
            $this->saveProductTranslations($product, $data);
            $variant = $product->variants()->where('is_default', true)->first() ?? $product->variants()->first();
            $variantData = [
                'sku' => $data['variant_sku'] ?? $data['sku'].'-DEFAULT',
                'price_toman' => $data['price_toman'],
                'price_usd' => $data['price_usd'],
                'compare_at_toman' => $data['compare_at_toman'] ?? null,
                'compare_at_usd' => $data['compare_at_usd'] ?? null,
                'stock' => $data['stock'],
                'low_stock_threshold' => $data['low_stock_threshold'] ?? 3,
            ];
            if (isset($data['variants']) && is_array($data['variants']) && count($data['variants']) > 0) {
                $this->saveProductVariants($product, $data['variants']);
            } elseif ($variant) {
                $variant->update($variantData);
            } else {
                $product->variants()->create($variantData + ['is_default' => true, 'is_active' => true]);
            }
            if (isset($data['images']) && is_array($data['images'])) {
                $this->saveProductImages($product, $data['images']);
            }
        });

        $this->audit('product.updated', $product, ['status' => $product->status]);
        return response()->json(['status' => 'success', 'message' => __('admin.product_updated'), 'data' => $this->productSummary($product->fresh()->load(['translations', 'variants.attributeValues', 'images', 'category.translations', 'brand.translations']))]);
    }

    public function destroyProduct(Product $product): JsonResponse
    {
        $product->delete();
        $this->audit('product.deleted', $product);
        return response()->json(['status' => 'success', 'message' => __('admin.product_deleted')]);
    }

    public function abandonedCarts(Request $request): JsonResponse
    {
        $carts = Cart::query()
            ->with(['user:id,name,phone,email', 'items.variant.product.translations'])
            ->where('status', 'active')
            ->where('updated_at', '<', now()->subHours(2))
            ->whereHas('items')
            ->latest('updated_at')
            ->paginate(min((int) $request->query('per_page', 20), 50));

        return response()->json([
            'status' => 'success',
            'data' => $carts->getCollection()->map(fn (Cart $cart) => [
                'id' => $cart->id,
                'customer_name' => $cart->user?->name,
                'customer_phone' => $cart->user?->phone,
                'customer_email' => $cart->user?->email,
                'items_count' => (int) $cart->items->sum('quantity'),
                'total_toman' => (int) $cart->items->sum(fn ($item) => (int) $item->unit_price_toman * (int) $item->quantity),
                'last_activity_at' => $cart->updated_at?->toIso8601String(),
                'recovery_reminded_at' => $cart->recovery_reminded_at?->toIso8601String(),
                'can_recover' => (bool) $cart->user?->email,
            ])->values(),
            'meta' => ['current_page' => $carts->currentPage(), 'last_page' => $carts->lastPage(), 'total' => $carts->total()],
        ]);
    }

    public function remindCart(Request $request, Cart $cart): JsonResponse
    {
        $cart->load(['user', 'items.variant.product.translations']);
        abort_unless($cart->status === 'active' && $cart->items->isNotEmpty(), 422, __('cart.empty'));
        abort_unless($cart->user?->email, 422, __('cart.recovery_email_missing'));

        $token = (string) Str::uuid();
        $cart->update(['recovery_token' => $token, 'recovery_reminded_at' => now()]);
        $frontendUrl = rtrim((string) env('FRONTEND_URL', env('APP_URL', 'http://localhost:3000')), '/');
        Mail::to($cart->user->email)->queue(new AbandonedCartReminder($cart, $frontendUrl.'/cart?recover='.urlencode($token)));
        $this->audit('cart.recovery_queued', $cart);

        return response()->json(['status' => 'success', 'message' => __('cart.recovery_queued')]);
    }

    public function orders(Request $request): JsonResponse
    {
        $query = Order::query()->with(['user:id,name,phone', 'items']);
        if ($status = $request->query('status')) $query->where('status', $status);
        if ($paymentStatus = $request->query('payment_status')) $query->where('payment_status', $paymentStatus);
        if ($request->filled('date_from')) $query->whereDate('created_at', '>=', $request->query('date_from'));
        if ($request->filled('date_to')) $query->whereDate('created_at', '<=', $request->query('date_to'));
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($builder) => $builder->where('number', 'like', "%{$search}%")->orWhere('customer_name', 'like', "%{$search}%")->orWhere('customer_phone', 'like', "%{$search}%"));
        }
        $sort = (string) $request->query('sort', 'created_at');
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';
        $query->orderBy(in_array($sort, ['created_at', 'total_toman', 'status'], true) ? $sort : 'created_at', $direction);
        $orders = $query->paginate(min((int) $request->query('per_page', 15), 50));
        return response()->json([
            'status' => 'success',
            'data' => $orders->getCollection()->map(fn (Order $order) => $this->orderSummary($order))->values(),
            'meta' => ['current_page' => $orders->currentPage(), 'last_page' => $orders->lastPage(), 'total' => $orders->total()],
        ]);
    }

    public function orderDetail(Order $order): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => $this->orderSummary($order->load(['user:id,name,phone,email', 'items']))]);
    }

    public function customerOrders(Request $request, User $user): JsonResponse
    {
        abort_unless($user->role === 'customer', 404);
        $orders = $user->orders()->with('items')->latest()->paginate(min((int) $request->query('per_page', 15), 50));
        return response()->json([
            'status' => 'success',
            'data' => $orders->getCollection()->map(fn (Order $order) => $this->orderSummary($order))->values(),
            'meta' => ['current_page' => $orders->currentPage(), 'last_page' => $orders->lastPage(), 'total' => $orders->total()],
        ]);
    }

    public function customerDetail(User $user): JsonResponse
    {
        abort_unless($user->role === 'customer', 404);
        $paidStatuses = ['paid', 'processing', 'shipped', 'completed'];
        $orders = $user->orders()->with('items')->latest()->limit(20)->get();
        $returns = ReturnRequest::query()->where('user_id', $user->id)->with('order:id,number')->latest()->limit(20)->get();
        $paymentCount = PaymentTransaction::query()->whereHas('order', fn ($query) => $query->where('user_id', $user->id))->where('status', 'paid')->count();
        return response()->json(['status' => 'success', 'data' => [
            'customer' => ['id' => $user->id, 'name' => $user->name ?: '—', 'phone' => $user->phone, 'email' => $user->email, 'created_at' => $user->created_at?->toIso8601String(), 'roles' => $user->roles()->get(['id', 'name', 'label'])->map(fn ($role) => ['id' => $role->id, 'name' => $role->name, 'label' => $role->label])->values()],
            'metrics' => ['orders_count' => $user->orders()->count(), 'paid_orders' => $user->orders()->whereIn('status', $paidStatuses)->count(), 'spent_toman' => (int) $user->orders()->whereIn('status', $paidStatuses)->sum('total_toman'), 'payment_transactions' => $paymentCount, 'returns_count' => $returns->count()],
            'orders' => $orders->map(fn (Order $order) => $this->orderSummary($order))->values(),
            'returns' => $returns->map(fn (ReturnRequest $return) => ['id' => $return->id, 'order_number' => $return->order?->number, 'status' => $return->status, 'reason' => $return->reason, 'created_at' => $return->created_at?->toIso8601String()])->values(),
        ]]);
    }

    public function updateOrder(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'returned', 'refunded'])]]);
        $previousStatus = $order->status;
        $order->update(['status' => $data['status'], 'cancelled_at' => $data['status'] === 'cancelled' ? now() : null]);
        $order->statusHistory()->create([
            'actor_id' => auth()->id(),
            'from_status' => $previousStatus,
            'to_status' => $data['status'],
            'ip_address' => $request->ip(),
        ]);
        $this->audit('order.status_updated', $order, ['from' => $previousStatus, 'to' => $data['status']]);
        return response()->json(['status' => 'success', 'message' => __('admin.order_updated'), 'data' => $this->orderSummary($order->fresh()->load(['user:id,name,phone', 'items']))]);
    }

    public function banners(Request $request): JsonResponse
    {
        $query = Banner::query()->orderBy('placement')->orderBy('sort_order')->latest('id');
        if ($placement = trim((string) $request->query('placement'))) {
            $query->where('placement', $placement);
        }
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($builder) => $builder
                ->where('placement', 'like', "%{$search}%")
                ->orWhere('title_fa', 'like', "%{$search}%")
                ->orWhere('title_en', 'like', "%{$search}%"));
        }
        $banners = $query->paginate(min((int) $request->query('per_page', 20), 50));

        return response()->json([
            'status' => 'success',
            'data' => $banners->getCollection()->map(fn (Banner $banner) => $this->bannerSummary($banner))->values(),
            'meta' => ['current_page' => $banners->currentPage(), 'last_page' => $banners->lastPage(), 'total' => $banners->total()],
        ]);
    }

    public function storeBanner(Request $request): JsonResponse
    {
        $banner = Banner::create($request->validate($this->bannerRules()));
        $this->audit('banner.created', $banner);

        return response()->json(['status' => 'success', 'message' => __('admin.banner_created'), 'data' => $this->bannerSummary($banner)], 201);
    }

    public function updateBanner(Request $request, Banner $banner): JsonResponse
    {
        $banner->update($request->validate($this->bannerRules()));
        $this->audit('banner.updated', $banner);

        return response()->json(['status' => 'success', 'message' => __('admin.banner_updated'), 'data' => $this->bannerSummary($banner->fresh())]);
    }

    public function destroyBanner(Banner $banner): JsonResponse
    {
        $banner->delete();
        $this->audit('banner.deleted', $banner);

        return response()->json(['status' => 'success', 'message' => __('admin.banner_deleted')]);
    }

    public function campaigns(Request $request): JsonResponse
    {
        $campaigns = Campaign::query()->withCount('products')->latest()->paginate(min((int) $request->query('per_page', 20), 50));
        return response()->json([
            'status' => 'success',
            'data' => $campaigns->getCollection()->map(function (Campaign $campaign): array {
                $productIds = DB::table('campaign_product')->where('campaign_id', $campaign->id)->pluck('product_id');
                $paidItems = OrderItem::query()->whereIn('product_id', $productIds)->whereHas('order', fn ($orders) => $orders->whereIn('status', ['paid', 'processing', 'shipped', 'completed']));
                return [
                    'id' => $campaign->id,
                    'slug' => $campaign->slug,
                    'name_fa' => $campaign->name_fa,
                    'name_en' => $campaign->name_en,
                    'discount_percent' => $campaign->discount_percent,
                    'starts_at' => $campaign->starts_at?->toIso8601String(),
                    'ends_at' => $campaign->ends_at?->toIso8601String(),
                    'is_active' => (bool) $campaign->is_active,
                    'products_count' => $campaign->products_count,
                    'ordered_quantity' => (int) (clone $paidItems)->sum('quantity'),
                    'revenue_toman' => (int) (clone $paidItems)->sum('total_toman'),
                    'impressions' => CampaignEvent::query()->where('campaign_id', $campaign->id)->whereIn('event_type', ['impression', 'view'])->count(),
                    'clicks' => CampaignEvent::query()->where('campaign_id', $campaign->id)->where('event_type', 'click')->count(),
                    'ab_variants' => CampaignEvent::query()->where('campaign_id', $campaign->id)->whereNotNull('variant')->select('variant')->selectRaw('count(*) as events')->groupBy('variant')->orderByDesc('events')->get()->map(fn ($event) => ['variant' => $event->variant, 'events' => (int) $event->events])->values(),
                ];
            })->values(),
            'meta' => ['current_page' => $campaigns->currentPage(), 'last_page' => $campaigns->lastPage(), 'total' => $campaigns->total()],
        ]);
    }

    public function storeCampaign(Request $request): JsonResponse
    {
        $request->merge(['slug' => $this->normalizedSlug((string) $request->input('slug', ''), 'campaign')]);
        $data = $request->validate($this->campaignRules());
        $campaign = Campaign::create($data);
        $this->audit('campaign.created', $campaign);
        return response()->json(['status' => 'success', 'message' => __('admin.campaign_created'), 'data' => $campaign], 201);
    }

    public function updateCampaign(Request $request, Campaign $campaign): JsonResponse
    {
        $request->merge(['slug' => $this->normalizedSlug((string) $request->input('slug', ''), 'campaign')]);
        $data = $request->validate($this->campaignRules($campaign));
        $campaign->update($data);
        $this->audit('campaign.updated', $campaign);
        return response()->json(['status' => 'success', 'message' => __('admin.campaign_updated'), 'data' => $campaign->fresh()]);
    }

    public function destroyCampaign(Campaign $campaign): JsonResponse
    {
        $campaign->delete();
        $this->audit('campaign.deleted', $campaign);
        return response()->json(['status' => 'success', 'message' => __('admin.campaign_deleted')]);
    }

    public function discounts(Request $request): JsonResponse
    {
        $query = DiscountCode::query()->latest();
        if ($search = trim((string) $request->query('search'))) $query->where('code', 'like', "%{$search}%");
        $discounts = $query->paginate(min((int) $request->query('per_page', 20), 50));
        return response()->json([
            'status' => 'success',
            'data' => $discounts->getCollection()->values(),
            'meta' => ['current_page' => $discounts->currentPage(), 'last_page' => $discounts->lastPage(), 'total' => $discounts->total()],
        ]);
    }

    public function storeDiscount(Request $request): JsonResponse
    {
        $data = $request->validate($this->discountRules());
        $discount = DiscountCode::create($data);
        $this->audit('discount.created', $discount);
        return response()->json(['status' => 'success', 'message' => __('admin.discount_created'), 'data' => $discount], 201);
    }

    public function updateDiscount(Request $request, DiscountCode $discountCode): JsonResponse
    {
        $data = $request->validate($this->discountRules($discountCode));
        $discountCode->update($data);
        $this->audit('discount.updated', $discountCode);
        return response()->json(['status' => 'success', 'message' => __('admin.discount_updated'), 'data' => $discountCode->fresh()]);
    }

    public function destroyDiscount(DiscountCode $discountCode): JsonResponse
    {
        $discountCode->delete();
        $this->audit('discount.deleted', $discountCode);
        return response()->json(['status' => 'success', 'message' => __('admin.discount_deleted')]);
    }

    public function customers(Request $request): JsonResponse
    {
        $query = User::query()->where('role', 'customer')->with(['roles:id,name,label'])->withCount('orders')->latest();
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($builder) => $builder->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }
        $sort = (string) $request->query('sort', 'created_at');
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';
        $query->orderBy(in_array($sort, ['created_at', 'name', 'phone'], true) ? $sort : 'created_at', $direction);
        $customers = $query->paginate(min((int) $request->query('per_page', 20), 50));
        return response()->json([
            'status' => 'success',
            'data' => $customers->getCollection()->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name ?: '—',
                'phone' => $user->phone,
                'email' => $user->email,
                'orders_count' => $user->orders_count,
                'roles' => $user->roles->map(fn (Role $role) => ['id' => $role->id, 'name' => $role->name, 'label' => $role->label])->values(),
                'created_at' => $user->created_at?->toIso8601String(),
            ])->values(),
            'meta' => ['current_page' => $customers->currentPage(), 'last_page' => $customers->lastPage(), 'total' => $customers->total()],
        ]);
    }

    public function reviews(Request $request): JsonResponse
    {
        $query = ProductReview::query()
            ->with(['user:id,name,phone', 'product:id,slug'])
            ->latest();
        if ($status = $request->query('status')) $query->where('status', $status);
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($builder) => $builder
                ->where('title', 'like', "%{$search}%")
                ->orWhere('body', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%")));
        }
        $reviews = $query->paginate(min((int) $request->query('per_page', 20), 50));
        return response()->json([
            'status' => 'success',
            'data' => $reviews->getCollection()->map(fn (ProductReview $review) => [
                'id' => $review->id,
                'rating' => (int) $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'status' => $review->status,
                'author' => $review->user?->name ?: $review->user?->phone,
                'product' => $review->product?->slug,
                'created_at' => $review->created_at?->toIso8601String(),
            ])->values(),
            'meta' => ['current_page' => $reviews->currentPage(), 'last_page' => $reviews->lastPage(), 'total' => $reviews->total()],
        ]);
    }

    public function bulkUpdateReviews(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'distinct', 'exists:product_reviews,id'],
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected', 'hidden'])],
        ]);

        $updated = ProductReview::query()->whereIn('id', $data['ids'])->update(['status' => $data['status']]);
        AdminAuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'reviews.bulk_status_updated',
            'auditable_type' => ProductReview::class,
            'auditable_id' => $data['ids'][0],
            'metadata' => ['ids' => $data['ids'], 'status' => $data['status']],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => __('admin.reviews_bulk_updated', ['count' => $updated]),
            'data' => ['updated' => $updated],
        ]);
    }

    public function updateReview(Request $request, ProductReview $review): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'approved', 'rejected', 'hidden'])]]);
        $previousStatus = $review->status;
        $review->update(['status' => $data['status']]);
        $this->audit('review.status_updated', $review, ['from' => $previousStatus, 'to' => $data['status']]);
        return response()->json(['status' => 'success', 'message' => __('admin.review_updated'), 'data' => ['id' => $review->id, 'status' => $review->status]]);
    }

    public function destroyReview(ProductReview $review): JsonResponse
    {
        $review->delete();
        $this->audit('review.deleted', $review);
        return response()->json(['status' => 'success', 'message' => __('admin.review_deleted')]);
    }

    public function landing(Campaign $campaign): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => $campaign->load('landingPage')->landingPage]);
    }

    public function updateLanding(Request $request, Campaign $campaign): JsonResponse
    {
        $request->merge(['slug' => $this->normalizedSlug((string) $request->input('slug', ''), 'campaign-page')]);
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('campaign_landing_pages', 'slug')->ignore($campaign->landingPage?->id)],
            'title_fa' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'description_fa' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'blocks' => ['nullable', 'array', 'max:30'],
            'blocks.*.type' => ['required_with:blocks', Rule::in(['hero', 'text', 'image', 'products', 'cta'])],
            'seo_title_fa' => ['nullable', 'string', 'max:255'],
            'seo_title_en' => ['nullable', 'string', 'max:255'],
            'is_published' => ['boolean'],
        ]);
        $landing = $campaign->landingPage()->updateOrCreate(['campaign_id' => $campaign->id], $data);
        $this->audit('campaign_landing.updated', $landing);
        return response()->json(['status' => 'success', 'message' => 'Campaign landing page updated.', 'data' => $landing]);
    }

    private function bannerRules(): array
    {
        return [
            'placement' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9._-]+$/'],
            'title_fa' => ['nullable', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'subtitle_fa' => ['nullable', 'string', 'max:1000'],
            'subtitle_en' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'string', 'max:2048'],
            'mobile_image' => ['nullable', 'string', 'max:2048'],
            'href' => ['nullable', 'string', 'max:2048'],
            'cta_fa' => ['nullable', 'string', 'max:80'],
            'cta_en' => ['nullable', 'string', 'max:80'],
            'accent_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6,8}$/'],
            'text_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6,8}$/'],
            'sort_order' => ['integer', 'min:0', 'max:100000'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    private function bannerSummary(Banner $banner): array
    {
        return [
            'id' => $banner->id,
            'placement' => $banner->placement,
            'title_fa' => $banner->title_fa,
            'title_en' => $banner->title_en,
            'subtitle_fa' => $banner->subtitle_fa,
            'subtitle_en' => $banner->subtitle_en,
            'image' => $banner->image,
            'mobile_image' => $banner->mobile_image,
            'href' => $banner->href,
            'cta_fa' => $banner->cta_fa,
            'cta_en' => $banner->cta_en,
            'accent_color' => $banner->accent_color,
            'text_color' => $banner->text_color,
            'sort_order' => (int) $banner->sort_order,
            'starts_at' => $banner->starts_at?->toIso8601String(),
            'ends_at' => $banner->ends_at?->toIso8601String(),
            'is_active' => (bool) $banner->is_active,
            'metadata' => $banner->metadata ?? [],
        ];
    }

    private function campaignRules(?Campaign $campaign = null): array
    {
        return [
            'slug' => ['required', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('campaigns', 'slug')->ignore($campaign?->id)],
            'name_fa' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'description_fa' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'discount_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'accent_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6,8}$/'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'is_active' => ['boolean'],
        ];
    }

    private function discountRules(?DiscountCode $discount = null): array
    {
        return [
            'code' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('discount_codes', 'code')->ignore($discount?->id)],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed_toman'])],
            'value_toman' => ['required_if:discount_type,fixed_toman', 'integer', 'min:0'],
            'value_usd' => ['nullable', 'numeric', 'min:0'],
            'percentage' => ['nullable', 'required_if:discount_type,percentage', 'integer', 'min:1', 'max:100'],
            'minimum_subtotal_toman' => ['integer', 'min:0'],
            'maximum_discount_toman' => ['nullable', 'integer', 'min:0'],
            'maximum_discount_usd' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['boolean'],
        ];
    }

    private function createProductRecord(array $data): Product
    {
        $product = Product::create([
            'category_id' => $data['category_id'] ?? null,
            'brand_id' => $data['brand_id'] ?? null,
            'slug' => $data['slug'],
            'sku' => $data['sku'],
            'gender' => $data['gender'],
            'status' => $data['status'],
            'is_featured' => $data['is_featured'] ?? false,
            'is_new' => $data['is_new'] ?? false,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
        $this->saveProductTranslations($product, $data);
        if (isset($data['variants']) && is_array($data['variants']) && count($data['variants']) > 0) {
            $this->saveProductVariants($product, $data['variants']);
        } else {
            $product->variants()->create([
                'sku' => $data['variant_sku'] ?? $data['sku'].'-DEFAULT',
                'price_toman' => $data['price_toman'],
                'price_usd' => $data['price_usd'],
                'compare_at_toman' => $data['compare_at_toman'] ?? null,
                'compare_at_usd' => $data['compare_at_usd'] ?? null,
                'stock' => $data['stock'],
                'low_stock_threshold' => $data['low_stock_threshold'] ?? 3,
                'is_default' => true,
                'is_active' => true,
            ]);
        }
        if (isset($data['images']) && is_array($data['images'])) {
            $this->saveProductImages($product, $data['images']);
        }

        return $product;
    }

    private function normalizeProductSlug(Request $request): void
    {
        $request->merge([
            'slug' => $this->normalizedSlug(
                (string) $request->input('slug', ''),
                'product',
            ),
        ]);
    }

    private function normalizeProductSku(Request $request, ?Product $product = null): void
    {
        $payload = $request->all();
        $payload['sku'] = $this->normalizedSku((string) ($payload['sku'] ?? ''))
            ?: ($product?->sku ?: $this->generateSku($payload['name_en'] ?? $payload['name_fa'] ?? 'product'));

        $existingDefaultSku = $product?->variants()->where('is_default', true)->value('sku');
        $payload['variant_sku'] = $this->normalizedSku((string) ($payload['variant_sku'] ?? ''))
            ?: ($existingDefaultSku ?: $this->uniqueVariantSku($payload['sku'].'-DEFAULT'));

        if (isset($payload['variants']) && is_array($payload['variants'])) {
            $payload['variants'] = array_map(fn (array $variant): array => [
                ...$variant,
                'sku' => $this->normalizedSku((string) ($variant['sku'] ?? ''))
                    ?: $this->uniqueVariantSku($payload['sku'].'-'.Str::upper(Str::random(5))),
            ], $payload['variants']);
        }
        $request->merge($payload);
    }

    private function normalizedSku(string $sku): string
    {
        $normalized = Str::upper(trim($sku));
        $normalized = preg_replace('/[^A-Z0-9_-]+/', '', $normalized) ?? '';
        return Str::limit($normalized, 120, '');
    }

    private function generateSku(string $name): string
    {
        $base = Str::upper(Str::slug(trim($name ?: 'PRODUCT')));
        $base = preg_replace('/[^A-Z0-9]+/', '-', $base) ?: 'PRODUCT';
        $base = Str::limit(trim($base, '-'), 42, '');

        do {
            $candidate = $this->normalizedSku('PRD-'.$base.'-'.Str::upper(Str::random(6)));
        } while (Product::withTrashed()->where('sku', $candidate)->exists() || ProductVariant::query()->where('sku', $candidate)->exists());

        return $candidate;
    }

    private function uniqueVariantSku(string $base): string
    {
        $candidate = $this->normalizedSku($base);
        if ($candidate !== '' && !ProductVariant::query()->where('sku', $candidate)->exists()) {
            return $candidate;
        }

        do {
            $candidate = $this->normalizedSku(($candidate ?: 'VARIANT').'-'.Str::upper(Str::random(6)));
        } while (ProductVariant::query()->where('sku', $candidate)->exists());

        return $candidate;
    }

    private function normalizedSlug(string $slug, string $fallback): string
    {
        if (trim($slug) !== '') {
            return Str::slug($slug);
        }

        return Str::slug($fallback).'-'.Str::lower(Str::random(8));
    }

    private function productRules(?Product $product = null): array
    {
        return [
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'slug' => ['required', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('products', 'slug')->ignore($product?->id)],
            'sku' => ['required', 'string', 'max:120', Rule::unique('products', 'sku')->ignore($product?->id)],
            'variant_sku' => ['nullable', 'string', 'max:120'],
            'gender' => ['required', Rule::in(['men', 'women', 'unisex'])],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'is_featured' => ['boolean'],
            'is_new' => ['boolean'],
            'sort_order' => ['integer', 'min:0', 'max:100000'],
            'name_fa' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'description_fa' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'translations' => ['nullable', 'array', 'max:20'],
            'translations.*.name' => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
            'price_toman' => ['required', 'integer', 'min:0'],
            'price_usd' => ['required', 'numeric', 'min:0'],
            'compare_at_toman' => ['nullable', 'integer', 'min:0'],
            'compare_at_usd' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'variants' => ['nullable', 'array', 'max:100'],
            'variants.*.sku' => ['required', 'string', 'max:120'],
            'variants.*.price_toman' => ['required', 'integer', 'min:0'],
            'variants.*.price_usd' => ['required', 'numeric', 'min:0'],
            'variants.*.compare_at_toman' => ['nullable', 'integer', 'min:0'],
            'variants.*.compare_at_usd' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'variants.*.low_stock_threshold' => ['required', 'integer', 'min:0', 'max:100000'],
            'variants.*.is_default' => ['boolean'],
            'variants.*.is_active' => ['boolean'],
            'variants.*.attribute_value_ids' => ['nullable', 'array', 'max:20'],
            'variants.*.attribute_value_ids.*' => ['integer', 'distinct', 'exists:attribute_values,id'],
            'images' => ['nullable', 'array', 'max:12'],
            'images.*.path' => ['required', 'string', 'max:1000'],
            'images.*.alt_text' => ['nullable', 'string', 'max:255'],
            'images.*.is_primary' => ['boolean'],
            'images.*.sort_order' => ['integer', 'min:0', 'max:1000'],
        ];
    }

    private function saveProductImages(Product $product, array $images): void
    {
        $product->images()->delete();
        foreach (array_values($images) as $index => $image) {
            $product->images()->create([
                'path' => trim((string) $image['path']),
                'alt_text' => $image['alt_text'] ?? null,
                'is_primary' => (bool) ($image['is_primary'] ?? $index === 0),
                'sort_order' => $image['sort_order'] ?? $index,
            ]);
        }
    }

    private function saveProductVariants(Product $product, array $variants): void
    {
        $product->variants()->delete();
        $hasDefault = false;
        foreach (array_values($variants) as $index => $variant) {
            $isDefault = (bool) ($variant['is_default'] ?? false) || (!$hasDefault && $index === count($variants) - 1);
            $createdVariant = $product->variants()->create([
                'sku' => $variant['sku'],
                'price_toman' => $variant['price_toman'],
                'price_usd' => $variant['price_usd'],
                'compare_at_toman' => $variant['compare_at_toman'] ?? null,
                'compare_at_usd' => $variant['compare_at_usd'] ?? null,
                'stock' => $variant['stock'],
                'low_stock_threshold' => $variant['low_stock_threshold'] ?? 3,
                'is_default' => $isDefault && !$hasDefault,
                'is_active' => $variant['is_active'] ?? true,
            ]);
            $createdVariant->attributeValues()->sync($variant['attribute_value_ids'] ?? []);
            $hasDefault = $hasDefault || $isDefault;
        }
    }

    private function saveProductTranslations(Product $product, array $data): void
    {
        $product->translations()->updateOrCreate(['locale_code' => 'fa'], ['name' => $data['name_fa'], 'description' => $data['description_fa'] ?? null]);
        // The shared translation table is Persian-only. Legacy name_en/description_en
        // columns are retained in the contract and receive the Persian values.

        $activeLocales = Locale::query()->where('is_active', true)->pluck('code')->map(fn ($code) => (string) $code)->all();
        foreach ((array) ($data['translations'] ?? []) as $locale => $translation) {
            if (!in_array((string) $locale, $activeLocales, true) || !is_array($translation) || trim((string) ($translation['name'] ?? '')) === '') {
                continue;
            }
            $product->translations()->updateOrCreate(
                ['locale_code' => (string) $locale],
                ['name' => $translation['name'], 'description' => $translation['description'] ?? null],
            );
        }
    }

    private function productSummary(Product $product): array
    {
        $variant = $product->variants->firstWhere('is_default', true) ?? $product->variants->first();
        return [
            'id' => $product->id,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'status' => $product->status,
            'gender' => $product->gender,
            'is_featured' => (bool) $product->is_featured,
            'is_new' => (bool) $product->is_new,
            'name_fa' => $this->translation($product->translations, 'fa') ?? $product->slug,
            'name_en' => $this->translation($product->translations, 'fa') ?? $product->slug,
            'description_fa' => $product->translations->firstWhere('locale_code', 'fa')?->description,
            'description_en' => $product->translations->firstWhere('locale_code', 'fa')?->description,
            'translations' => $product->translations->mapWithKeys(fn ($translation) => [
                $translation->locale_code => [
                    'name' => $translation->name,
                    'description' => $translation->description,
                ],
            ])->all(),
            'category_id' => $product->category_id,
            'brand_id' => $product->brand_id,
            'brand' => $this->translation($product->brand?->translations, 'fa') ?? $product->brand?->slug,
            'category' => $this->translation($product->category?->translations, 'fa') ?? $product->category?->slug,
            'price_toman' => (int) ($variant?->price_toman ?? 0),
            'price_usd' => (float) ($variant?->price_usd ?? 0),
            'compare_at_toman' => $variant?->compare_at_toman ? (int) $variant->compare_at_toman : null,
            'compare_at_usd' => $variant?->compare_at_usd ? (float) $variant->compare_at_usd : null,
            'stock' => (int) ($variant?->stock ?? 0),
            'low_stock_threshold' => (int) ($variant?->low_stock_threshold ?? 3),
            'low_stock' => (int) ($variant?->stock ?? 0) <= (int) ($variant?->low_stock_threshold ?? 0),
            'sort_order' => (int) $product->sort_order,
            'sold_quantity' => (int) ($product->order_items_sum_quantity ?? 0),
            'images' => $product->images?->map(fn ($image) => [
                'id' => $image->id,
                'path' => $image->path,
                'alt_text' => $image->alt_text,
                'is_primary' => (bool) $image->is_primary,
                'sort_order' => (int) $image->sort_order,
            ])->values(),
            'variants' => $product->variants?->map(fn (ProductVariant $variant) => [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'price_toman' => (int) $variant->price_toman,
                'price_usd' => (float) $variant->price_usd,
                'compare_at_toman' => $variant->compare_at_toman ? (int) $variant->compare_at_toman : null,
                'compare_at_usd' => $variant->compare_at_usd ? (float) $variant->compare_at_usd : null,
                'stock' => (int) $variant->stock,
                'low_stock_threshold' => (int) $variant->low_stock_threshold,
                'is_default' => (bool) $variant->is_default,
                'is_active' => (bool) $variant->is_active,
                'attribute_value_ids' => $variant->relationLoaded('attributeValues') ? $variant->attributeValues->pluck('id')->values() : [],
            ])->values(),
        ];
    }

    private function orderSummary(Order $order): array
    {
        return [
            'id' => $order->id,
            'number' => $order->number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'user' => $order->user ? ['id' => $order->user->id, 'name' => $order->user->name, 'phone' => $order->user->phone] : null,
            'items_count' => (int) ($order->items?->sum('quantity') ?? 0),
            'items' => $order->items?->map(fn ($item) => [
                'id' => $item->id,
                'sku' => $item->sku,
                'name_fa' => $item->product_name_fa,
                'name_en' => $item->product_name_en,
                'quantity' => (int) $item->quantity,
                'unit_price_toman' => (int) $item->unit_price_toman,
                'total_toman' => (int) $item->total_toman,
            ])->values(),
            'total_toman' => (int) $order->total_toman,
            'total_usd' => (float) $order->total_usd,
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }

    private function translation($translations, string $locale): ?string
    {
        return $translations?->firstWhere('locale_code', $locale)?->name;
    }

    private function audit(string $action, $model, array $metadata = []): void
    {
        AdminAuditLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'auditable_type' => $model::class,
            'auditable_id' => $model->getKey(),
            'metadata' => $metadata,
        ]);
    }
}

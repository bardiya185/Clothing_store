<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use App\Models\AdminAuditLog;
use App\Models\Brand;
use App\Models\Category;
use App\Models\HomepageSection;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Refund;
use App\Models\ReturnRequest;
use App\Models\Shipment;
use App\Models\ShippingMethod;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OperationsController extends Controller
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function inventory(Request $request): JsonResponse
    {
        $query = InventoryMovement::query()->with(['variant.product.translations', 'actor:id,name,phone'])->latest();
        if ($request->filled('variant_id')) $query->where('variant_id', $request->query('variant_id'));
        if ($request->filled('movement_type')) $query->where('movement_type', $request->query('movement_type'));
        $movements = $query->paginate(min((int) $request->query('per_page', 30), 100));
        return response()->json(['status' => 'success', 'data' => $movements->getCollection()->map(fn (InventoryMovement $movement) => ['id' => $movement->id, 'variant_id' => $movement->variant_id, 'sku' => $movement->variant?->sku, 'product' => $movement->variant?->product?->translations->firstWhere('locale_code', 'fa')?->name ?? $movement->variant?->product?->slug, 'movement_type' => $movement->movement_type, 'quantity_delta' => (int) $movement->quantity_delta, 'stock_before' => (int) $movement->stock_before, 'stock_after' => (int) $movement->stock_after, 'reason' => $movement->reason, 'actor' => $movement->actor?->name ?? $movement->actor?->phone, 'created_at' => $movement->created_at?->toIso8601String()])->values(), 'meta' => $this->meta($movements)]);
    }

    public function adjustInventory(Request $request): JsonResponse
    {
        $data = $request->validate(['variant_id' => ['required', 'integer', 'exists:product_variants,id'], 'quantity_delta' => ['required', 'integer', 'not_in:0'], 'reason' => ['required', 'string', 'max:120']]);
        $movement = $this->inventory->adjust(ProductVariant::query()->findOrFail($data['variant_id']), (int) $data['quantity_delta'], $request->user(), $data['reason'], 'admin_adjustment');
        $this->audit('inventory.adjusted', $movement, ['quantity_delta' => $movement->quantity_delta, 'reason' => $movement->reason]);
        return response()->json(['status' => 'success', 'data' => $movement->load('variant')]);
    }

    public function payments(Request $request): JsonResponse
    {
        $query = PaymentTransaction::query()->with('order:id,number,customer_name')->latest();
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        $payments = $query->paginate(min((int) $request->query('per_page', 30), 100));
        return response()->json(['status' => 'success', 'data' => $payments->getCollection()->values(), 'meta' => $this->meta($payments)]);
    }

    public function shippingMethods(): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => ShippingMethod::query()->orderBy('sort_order')->orderBy('id')->get()]);
    }

    public function storeShippingMethod(Request $request): JsonResponse
    {
        $data = $request->validate($this->shippingMethodRules());
        $method = ShippingMethod::create($data);
        $this->audit('shipping_method.created', $method);
        return response()->json(['status' => 'success', 'data' => $method], 201);
    }

    public function updateShippingMethod(Request $request, ShippingMethod $method): JsonResponse
    {
        $data = $request->validate($this->shippingMethodRules($method));
        $method->update($data);
        $this->audit('shipping_method.updated', $method);
        return response()->json(['status' => 'success', 'data' => $method->fresh()]);
    }

    public function destroyShippingMethod(ShippingMethod $method): JsonResponse
    {
        abort_if($method->shipments()->exists(), 422, 'A shipping method used by shipments cannot be deleted.');
        $method->delete();
        return response()->json(['status' => 'success']);
    }

    public function shipments(Request $request): JsonResponse
    {
        $query = Shipment::query()->with(['order:id,number,customer_name', 'method'])->latest();
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        $shipments = $query->paginate(min((int) $request->query('per_page', 30), 100));
        return response()->json(['status' => 'success', 'data' => $shipments->getCollection()->values(), 'meta' => $this->meta($shipments)]);
    }

    public function updateShipment(Request $request, Shipment $shipment): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'registered', 'shipped', 'in_transit', 'delivered', 'failed', 'cancelled'])], 'tracking_code' => ['nullable', 'string', 'max:120'], 'failure_reason' => ['nullable', 'string']]);
        $shipment->update([...$data, 'shipped_at' => $data['status'] === 'shipped' ? now() : $shipment->shipped_at, 'delivered_at' => $data['status'] === 'delivered' ? now() : $shipment->delivered_at]);
        $this->audit('shipment.updated', $shipment, $data);
        return response()->json(['status' => 'success', 'data' => $shipment->fresh()]);
    }

    public function homepageSections(): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => HomepageSection::query()->orderBy('sort_order')->orderBy('id')->get()]);
    }

    public function storeHomepageSection(Request $request): JsonResponse
    {
        $data = $request->validate($this->homepageRules());
        $section = HomepageSection::create($data + ['published_at' => ($data['is_active'] ?? false) ? now() : null]);
        $this->audit('homepage_section.created', $section);
        return response()->json(['status' => 'success', 'data' => $section], 201);
    }

    public function updateHomepageSection(Request $request, HomepageSection $section): JsonResponse
    {
        $data = $request->validate($this->homepageRules($section));
        $section->update($data + ['published_at' => ($data['is_active'] ?? $section->is_active) ? ($section->published_at ?? now()) : null]);
        $this->audit('homepage_section.updated', $section);
        return response()->json(['status' => 'success', 'data' => $section->fresh()]);
    }

    public function destroyHomepageSection(HomepageSection $section): JsonResponse { $section->delete(); return response()->json(['status' => 'success']); }

    public function notifications(Request $request): JsonResponse
    {
        $query = AdminNotification::query()->where(fn ($builder) => $builder->whereNull('user_id')->orWhere('user_id', $request->user()->id))->latest();
        if ($request->boolean('unread_only')) $query->whereNull('read_at');
        $notifications = $query->paginate(min((int) $request->query('per_page', 30), 100));
        return response()->json(['status' => 'success', 'data' => $notifications->getCollection()->values(), 'meta' => $this->meta($notifications)]);
    }

    public function markNotificationRead(Request $request, AdminNotification $notification): JsonResponse
    {
        abort_unless(!$notification->user_id || $notification->user_id === $request->user()->id, 404);
        $notification->update(['read_at' => now()]);
        return response()->json(['status' => 'success', 'data' => $notification]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $period = (int) $request->query('period', 30);
        abort_unless(in_array($period, [7, 30, 90], true), 422, 'Period must be 7, 30 or 90 days.');
        $paidStatuses = ['paid', 'processing', 'shipped', 'completed'];
        $sales = collect(range($period - 1, 0))->map(function (int $daysAgo) use ($paidStatuses): array {
            $date = now()->subDays($daysAgo)->startOfDay();
            return ['date' => $date->toDateString(), 'label' => $date->format('m/d'), 'orders' => Order::query()->whereDate('created_at', $date)->count(), 'revenue_toman' => (int) Order::query()->whereDate('created_at', $date)->whereIn('status', $paidStatuses)->sum('total_toman')];
        })->values();
        $from = now()->subDays($period - 1)->startOfDay();
        return response()->json(['status' => 'success', 'data' => ['period' => $period, 'summary' => ['orders' => Order::query()->where('created_at', '>=', $from)->count(), 'paid_orders' => Order::query()->where('created_at', '>=', $from)->whereIn('status', $paidStatuses)->count(), 'revenue_toman' => (int) Order::query()->where('created_at', '>=', $from)->whereIn('status', $paidStatuses)->sum('total_toman'), 'average_order_toman' => (int) Order::query()->where('created_at', '>=', $from)->whereIn('status', $paidStatuses)->avg('total_toman')], 'sales' => $sales]]);
    }

    public function search(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q'));
        abort_if($term === '', 422, 'Search query is required.');
        $products = Product::query()->with('translations')->where(fn ($query) => $query->where('sku', 'like', "%{$term}%")->orWhere('slug', 'like', "%{$term}%")->orWhereHas('translations', fn ($translations) => $translations->where('name', 'like', "%{$term}%")))->limit(8)->get()->map(fn (Product $product) => ['type' => 'product', 'id' => $product->id, 'label' => $product->translations->firstWhere('locale_code', 'fa')?->name ?? $product->slug, 'meta' => $product->sku]);
        $orders = Order::query()->where(fn ($query) => $query->where('number', 'like', "%{$term}%")->orWhere('customer_name', 'like', "%{$term}%")->orWhere('customer_phone', 'like', "%{$term}%"))->limit(8)->get()->map(fn (Order $order) => ['type' => 'order', 'id' => $order->id, 'label' => $order->number, 'meta' => $order->customer_name]);
        $customers = \App\Models\User::query()->where('role', 'customer')->where(fn ($query) => $query->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%")->orWhere('phone', 'like', "%{$term}%"))->limit(8)->get()->map(fn ($user) => ['type' => 'customer', 'id' => $user->id, 'label' => $user->name ?: $user->phone, 'meta' => $user->email ?? $user->phone]);
        $brands = Brand::query()->with('translations')->where('slug', 'like', "%{$term}%")->orWhereHas('translations', fn ($translations) => $translations->where('name', 'like', "%{$term}%"))->limit(8)->get()->map(fn (Brand $brand) => ['type' => 'brand', 'id' => $brand->id, 'label' => $brand->translations->firstWhere('locale_code', 'fa')?->name ?? $brand->slug, 'meta' => $brand->slug]);
        $categories = Category::query()->with('translations')->where('slug', 'like', "%{$term}%")->orWhereHas('translations', fn ($translations) => $translations->where('name', 'like', "%{$term}%"))->limit(8)->get()->map(fn (Category $category) => ['type' => 'category', 'id' => $category->id, 'label' => $category->translations->firstWhere('locale_code', 'fa')?->name ?? $category->slug, 'meta' => $category->slug]);
        return response()->json(['status' => 'success', 'data' => $products->concat($orders)->concat($customers)->concat($brands)->concat($categories)->values()]);
    }

    public function returns(Request $request): JsonResponse
    {
        $query = ReturnRequest::query()->with(['order:id,number,customer_name', 'user:id,name,phone'])->latest();
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        $returns = $query->paginate(min((int) $request->query('per_page', 30), 100));
        return response()->json(['status' => 'success', 'data' => $returns->getCollection()->values(), 'meta' => $this->meta($returns)]);
    }

    public function updateReturn(Request $request, ReturnRequest $return): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['requested', 'approved', 'rejected', 'received', 'refunded', 'cancelled'])], 'note' => ['nullable', 'string']]);
        $return->update($data);
        $this->audit('return.updated', $return, $data);
        return response()->json(['status' => 'success', 'data' => $return->fresh()]);
    }

    public function refunds(Request $request): JsonResponse
    {
        $query = Refund::query()->with(['order:id,number,customer_name', 'returnRequest:id,order_id,status'])->latest();
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        $refunds = $query->paginate(min((int) $request->query('per_page', 30), 100));
        return response()->json(['status' => 'success', 'data' => $refunds->getCollection()->values(), 'meta' => $this->meta($refunds)]);
    }

    public function createRefund(Request $request, ReturnRequest $return): JsonResponse
    {
        abort_unless(in_array($return->status, ['approved', 'received'], true), 422, 'A return must be approved or received before a refund can be requested.');
        $data = $request->validate(['provider' => ['required', 'string', 'max:40'], 'amount_toman' => ['required', 'integer', 'min:1'], 'amount_usd' => ['required', 'numeric', 'min:0.01'], 'reason' => ['nullable', 'string', 'max:500']]);
        $return->loadMissing('order');
        abort_if((int) $data['amount_toman'] > (int) $return->order->total_toman || (float) $data['amount_usd'] > (float) $return->order->total_usd, 422, 'Refund amount cannot exceed the order total.');
        $refund = Refund::create(['order_id' => $return->order_id, 'return_id' => $return->id, 'status' => 'pending', 'provider' => $data['provider'], 'amount_toman' => $data['amount_toman'], 'amount_usd' => $data['amount_usd'], 'reason' => $data['reason'] ?? null]);
        $this->audit('refund.requested', $refund, ['return_id' => $return->id]);
        return response()->json(['status' => 'success', 'data' => $refund], 201);
    }

    public function updateRefund(Request $request, Refund $refund): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'processing', 'completed', 'failed', 'cancelled'])], 'reference' => ['nullable', 'string', 'max:180'], 'reason' => ['nullable', 'string', 'max:500']]);
        $refund->update([...$data, 'refunded_at' => $data['status'] === 'completed' ? now() : $refund->refunded_at]);
        if ($data['status'] === 'completed' && $refund->returnRequest) $refund->returnRequest->update(['status' => 'refunded']);
        $this->audit('refund.updated', $refund, $data);
        return response()->json(['status' => 'success', 'data' => $refund->fresh()]);
    }

    private function shippingMethodRules(?ShippingMethod $method = null): array
    {
        return ['code' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('shipping_methods', 'code')->ignore($method?->id)], 'name_fa' => ['required', 'string', 'max:120'], 'name_en' => ['required', 'string', 'max:120'], 'price_toman' => ['required', 'integer', 'min:0'], 'price_usd' => ['required', 'numeric', 'min:0'], 'estimated_days' => ['nullable', 'integer', 'min:0', 'max:365'], 'is_active' => ['boolean'], 'sort_order' => ['integer', 'min:0', 'max:100000'], 'metadata' => ['nullable', 'array']];
    }

    private function homepageRules(?HomepageSection $section = null): array { return ['key' => ['required', 'string', 'max:100', Rule::unique('homepage_sections', 'key')->ignore($section?->id)], 'section_type' => ['required', Rule::in(['hero', 'featured_products', 'new_arrivals', 'best_sellers', 'categories', 'brands', 'campaigns', 'flash_sale'])], 'payload' => ['nullable', 'array'], 'sort_order' => ['integer', 'min:0', 'max:100000'], 'starts_at' => ['nullable', 'date'], 'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'], 'is_active' => ['boolean']]; }
    private function audit(string $action, $model, array $metadata = []): void { AdminAuditLog::create(['user_id' => auth()->id(), 'action' => $action, 'auditable_type' => $model::class, 'auditable_id' => $model->getKey(), 'metadata' => $metadata]); }
    private function meta($p): array { return ['current_page' => $p->currentPage(), 'last_page' => $p->lastPage(), 'total' => $p->total()]; }
}

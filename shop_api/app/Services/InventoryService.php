<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function adjust(ProductVariant $variant, int $delta, ?User $actor = null, ?string $reason = null, ?string $referenceType = null, ?int $referenceId = null, array $metadata = []): InventoryMovement
    {
        if ($delta === 0) {
            throw ValidationException::withMessages(['quantity_delta' => ['Inventory delta cannot be zero.']]);
        }

        return DB::transaction(function () use ($variant, $delta, $actor, $reason, $referenceType, $referenceId, $metadata): InventoryMovement {
            $locked = ProductVariant::query()->whereKey($variant->id)->lockForUpdate()->firstOrFail();
            $before = (int) $locked->stock;
            $after = $before + $delta;
            if ($after < 0) {
                throw ValidationException::withMessages(['quantity_delta' => ['Inventory cannot become negative.']]);
            }
            $locked->update(['stock' => $after]);

            return InventoryMovement::create([
                'variant_id' => $locked->id,
                'actor_id' => $actor?->id,
                'movement_type' => $delta > 0 ? 'adjustment_in' : 'adjustment_out',
                'quantity_delta' => $delta,
                'stock_before' => $before,
                'stock_after' => $after,
                'reason' => $reason,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'metadata' => $metadata,
            ]);
        });
    }

    public function recordLocked(ProductVariant $variant, int $delta, ?User $actor = null, string $movementType = 'sale', ?string $reason = null, ?string $referenceType = null, ?int $referenceId = null): InventoryMovement
    {
        $before = (int) $variant->stock + ($delta < 0 ? abs($delta) : 0);
        $after = (int) $variant->stock;
        return InventoryMovement::create([
            'variant_id' => $variant->id,
            'actor_id' => $actor?->id,
            'movement_type' => $movementType,
            'quantity_delta' => $delta,
            'stock_before' => $before,
            'stock_after' => $after,
            'reason' => $reason,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);
    }
}

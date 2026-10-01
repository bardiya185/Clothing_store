<?php

namespace App\Services;

use App\Models\DiscountCode;
use Illuminate\Validation\ValidationException;

class DiscountCodeService
{
    /** @return array{code: string, discount_toman: int, discount_usd: float} */
    public function calculate(
        string $rawCode,
        int $subtotalToman,
        float $subtotalUsd,
        bool $lock = false,
    ): array {
        $code = strtoupper(trim($rawCode));
        $query = DiscountCode::query()->whereRaw('UPPER(code) = ?', [$code]);
        if ($lock) $query->lockForUpdate();
        $discountCode = $query->first();

        if (!$discountCode || !$discountCode->is_active) {
            throw ValidationException::withMessages(['discount_code' => [__('discount.invalid')]]);
        }
        if ($discountCode->starts_at && now()->isBefore($discountCode->starts_at)) {
            throw ValidationException::withMessages(['discount_code' => [__('discount.inactive')]]);
        }
        if ($discountCode->ends_at && now()->isAfter($discountCode->ends_at)) {
            throw ValidationException::withMessages(['discount_code' => [__('discount.expired')]]);
        }
        if ($discountCode->usage_limit !== null && $discountCode->used_count >= $discountCode->usage_limit) {
            throw ValidationException::withMessages(['discount_code' => [__('discount.limit_reached')]]);
        }
        if ($subtotalToman < $discountCode->minimum_subtotal_toman) {
            throw ValidationException::withMessages([
                'discount_code' => [__('discount.minimum_subtotal', ['amount' => number_format($discountCode->minimum_subtotal_toman)])],
            ]);
        }

        if ($discountCode->discount_type === 'percentage') {
            $percentage = (int) ($discountCode->percentage ?? 0);
            $discountToman = (int) floor($subtotalToman * $percentage / 100);
            $discountUsd = round($subtotalUsd * $percentage / 100, 2);
        } else {
            $discountToman = (int) $discountCode->value_toman;
            $discountUsd = (float) $discountCode->value_usd;
        }

        if ($discountCode->maximum_discount_toman !== null) {
            $discountToman = min($discountToman, (int) $discountCode->maximum_discount_toman);
        }
        if ($discountCode->maximum_discount_usd !== null) {
            $discountUsd = min($discountUsd, (float) $discountCode->maximum_discount_usd);
        }

        return [
            'code' => $discountCode->code,
            'discount_toman' => min($discountToman, $subtotalToman),
            'discount_usd' => min(round($discountUsd, 2), $subtotalUsd),
        ];
    }

    public function markUsed(string $code): void
    {
        DiscountCode::query()
            ->whereRaw('UPPER(code) = ?', [strtoupper(trim($code))])
            ->increment('used_count');
    }
}

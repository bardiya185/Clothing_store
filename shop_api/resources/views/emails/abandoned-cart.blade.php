<!doctype html>
<html lang="en">
  <body style="font-family: Arial, sans-serif; color: #18202a; line-height: 1.7;">
    <h1>{{ config('app.name', 'Baran') }}</h1>
    <p>{{ $cart->user?->name ?: __('cart.customer') }},</p>
    <p>{{ __('cart.recovery_body') }}</p>
    <ul>
      @foreach ($cart->items as $item)
        <li>{{ $item->variant?->product?->translations?->firstWhere('locale_code', 'fa')?->name ?: $item->variant?->sku }} × {{ $item->quantity }}</li>
      @endforeach
    </ul>
    <p><a href="{{ $recoveryUrl }}" style="display:inline-block;background:#111827;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;">{{ __('cart.recovery_cta') }}</a></p>
  </body>
</html>

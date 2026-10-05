<?php

namespace App\Console\Commands;

use App\Mail\AbandonedCartReminder;
use App\Models\Cart;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendAbandonedCartReminders extends Command
{
    protected $signature = 'cart:send-recovery {--hours=2 : Minimum inactive hours} {--limit=100 : Maximum reminders per run}';
    protected $description = 'Queue recovery emails for eligible abandoned carts.';

    public function handle(): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $limit = min(500, max(1, (int) $this->option('limit')));
        $frontendUrl = rtrim((string) env('FRONTEND_URL', env('APP_URL', 'http://localhost:3000')), '/');
        $sent = 0;

        Cart::query()
            ->with(['user', 'items.variant.product.translations'])
            ->where('status', 'active')
            ->where('updated_at', '<=', now()->subHours($hours))
            ->whereHas('items')
            ->whereHas('user', fn ($users) => $users->whereNotNull('email'))
            ->where(fn ($query) => $query->whereNull('recovery_reminded_at')->orWhere('recovery_reminded_at', '<=', now()->subDay()))
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->each(function (Cart $cart) use (&$sent, $frontendUrl): void {
                $token = (string) Str::uuid();
                $cart->update(['recovery_token' => $token, 'recovery_reminded_at' => now()]);
                $url = $frontendUrl.'/cart?recover='.urlencode($token);
                Mail::to($cart->user->email)->queue(new AbandonedCartReminder($cart, $url));
                $sent++;
            });

        $this->info("Queued {$sent} abandoned-cart reminder(s).");
        return self::SUCCESS;
    }
}

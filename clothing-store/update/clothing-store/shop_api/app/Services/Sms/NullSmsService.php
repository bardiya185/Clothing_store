<?php

namespace App\Services\Sms;

use App\Contracts\SmsServiceInterface;

class NullSmsService implements SmsServiceInterface
{
    public function send(string $phone, string $message): bool
    {
        // هیچ کاری نمی‌کند
        return true;
    }
}

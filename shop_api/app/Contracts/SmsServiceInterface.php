<?php

namespace App\Contracts;

interface SmsServiceInterface
{
    /**
     * ارسال پیامک به شماره مشخص
     *
     * @param string $phone   شماره گیرنده (مثل 09123456789)
     * @param string $message متن پیام
     * @return bool           آیا ارسال موفق بود؟
     */
    public function send(string $phone, string $message): bool;
}

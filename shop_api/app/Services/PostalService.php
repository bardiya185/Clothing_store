<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PostalService
{
    public function register(Order $order, Address $address): array
    {
        $baseUrl = rtrim((string) config('services.national_post.base_url'), '/');
        $apiKey = (string) config('services.national_post.api_key');
        $path = (string) config('services.national_post.register_path', '/shipments');

        if ($baseUrl === '' || $apiKey === '') {
            return ['status' => 'not_configured', 'tracking_code' => null];
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(12)
                ->post($baseUrl.'/'.ltrim($path, '/'), [
                    'order_number' => $order->number,
                    'recipient_name' => $address->recipient_name,
                    'phone' => $address->phone,
                    'province' => $address->province,
                    'city' => $address->city,
                    'address' => $address->address,
                    'postal_code' => $address->postal_code,
                    'client_reference' => Str::upper($order->number),
                ]);

            if (!$response->successful()) {
                return ['status' => 'registration_failed', 'tracking_code' => null];
            }

            $trackingCode = data_get($response->json(), 'tracking_code')
                ?? data_get($response->json(), 'data.tracking_code');
            if (!$trackingCode) {
                return ['status' => 'registration_failed', 'tracking_code' => null];
            }

            return [
                'status' => 'registered',
                'tracking_code' => $trackingCode,
            ];
        } catch (\Throwable) {
            return ['status' => 'registration_failed', 'tracking_code' => null];
        }
    }
}

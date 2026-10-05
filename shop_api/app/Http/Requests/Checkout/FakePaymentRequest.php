<?php

namespace App\Http\Requests\Checkout;

use Illuminate\Foundation\Http\FormRequest;

class FakePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer', 'exists:addresses,id'],
            'card_number' => ['required', 'digits:16'],
        ];
    }

    public function messages(): array
    {
        return [
            'address_id.required' => __('checkout.address_required'),
            'card_number.required' => __('checkout.card_number_required'),
            'card_number.digits' => __('checkout.card_number_digits'),
        ];
    }
}

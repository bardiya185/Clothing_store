<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'regex:/^09[0-9]{9}$/'],
            'code'  => ['required', 'string', 'digits:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => __('auth.phone_required'),
            'phone.regex'    => __('auth.phone_invalid'),
            'code.required'  => __('auth.code_required'),
            'code.digits'    => __('auth.code_invalid'),
        ];
    }
}

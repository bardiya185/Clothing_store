<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email,'.$this->user()?->id],
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/', 'unique:users,phone,'.$this->user()?->id],
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => __('account.name_invalid'),
            'email.email' => __('account.email_invalid'),
            'email.unique' => __('account.email_taken'),
            'phone.required' => __('account.phone_required'),
            'phone.regex' => __('account.phone_invalid'),
            'phone.unique' => __('account.phone_taken'),
        ];
    }
}

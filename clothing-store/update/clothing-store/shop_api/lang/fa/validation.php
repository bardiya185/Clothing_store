<?php

return [
    'required' => ':attribute الزامی است.',
    'string' => ':attribute باید متن باشد.',
    'integer' => ':attribute باید عدد صحیح باشد.',
    'numeric' => ':attribute باید عدد باشد.',
    'min' => [
        'numeric' => ':attribute باید حداقل :min باشد.',
        'string' => ':attribute باید حداقل :min کاراکتر باشد.',
    ],
    'max' => [
        'numeric' => ':attribute نمی‌تواند بیشتر از :max باشد.',
        'string' => ':attribute نمی‌تواند بیشتر از :max کاراکتر باشد.',
    ],
    'email' => 'فرمت :attribute صحیح نیست.',
    'regex' => 'فرمت :attribute صحیح نیست.',
    'digits' => ':attribute باید :digits رقم باشد.',
    'unique' => ':attribute قبلاً ثبت شده است.',
    'attributes' => [
        'phone' => 'شماره موبایل',
        'code' => 'کد تأیید',
        'email' => 'ایمیل',
        'refresh_token' => 'رفرش توکن',
    ],
];

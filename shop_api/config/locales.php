<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Locale fallback configuration
    |--------------------------------------------------------------------------
    |
    | The database `locales` table is the source of truth for active languages.
    | These values keep locale-aware APIs safe during installation/early boot
    | and define the fallback chain for languages that do not have a complete
    | translation yet.
    |
    */
    'default' => env('DEFAULT_LOCALE', 'fa'),

    'supported' => ['fa'],

    'fallbacks' => [
        'fa' => 'fa',
        '*' => 'fa',
    ],

    'currencies' => [
        'fa' => 'IRT',
        '*' => 'IRT',
    ],
];

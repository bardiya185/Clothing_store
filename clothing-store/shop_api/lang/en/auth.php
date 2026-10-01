<?php

return [
    // Success messages
    'otp_sent'          => 'Verification code sent.',
    'register_success'  => 'Registration completed successfully.',
    'login_success'     => 'Logged in successfully.',
    'logout_success'    => 'Logged out successfully.',
    'logout_all_success'=> 'Logged out from all devices.',
    'otp_message' => 'Your verification code: :code',
    'unnamed_user'    => 'New User',
    'token_refreshed' => 'Your token has been refreshed successfully.',

    // Error messages
    'phone_required'    => 'Phone number is required.',
    'phone_invalid'     => 'Phone must start with 09 and be 11 digits.',
    'code_required'     => 'Verification code is required.',
    'code_invalid'      => 'Verification code must be 6 digits.',
    'code_wrong'        => 'The entered code is incorrect.',
    'code_expired'      => 'The code has expired. Please request a new one.',
    'code_not_found'    => 'No code found for this number.',
    'code_too_many_tries' => 'Too many failed attempts. Please request a new code.',
    'otp_rate_limit'    => 'Please try again in 2 minutes.',
    'unauthorized'      => 'You are not authorized to access this section.',
];

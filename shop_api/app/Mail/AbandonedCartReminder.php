<?php

namespace App\Mail;

use App\Models\Cart;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AbandonedCartReminder extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Cart $cart, public string $recoveryUrl) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: __('cart.recovery_subject'));
    }

    public function content(): Content
    {
        return new Content(view: 'emails.abandoned-cart');
    }
}

# Integration configuration

## Neshan address picker

Set the browser-exposed map key in `frontend/.env.local` before starting Next.js:

```env
NEXT_PUBLIC_NESHAN_MAP_KEY=your-neshan-web-api-key
```

The key is intentionally read from `NEXT_PUBLIC_NESHAN_MAP_KEY` and is never hardcoded. The account address form renders a real Neshan map when it is present, supports map clicks and draggable marker movement, and uses Neshan reverse geocoding when the user confirms a point. Without the key, the form shows a bilingual not-configured state instead of a fake map.

## Iran National Post shipment registration

The backend adapter reads these Laravel environment variables:

```env
NATIONAL_POST_API_URL=https://your-post-provider.example/api
NATIONAL_POST_API_KEY=your-provider-credential
NATIONAL_POST_REGISTER_PATH=/shipments
```

`NATIONAL_POST_API_URL` and `NATIONAL_POST_API_KEY` must both be present before an external request is attempted. The adapter sends an order and saved-address payload to the configured registration path. It never reports an unverified request as successful: orders remain `not_configured` when credentials are absent and become `registration_failed` when the configured provider rejects or cannot answer the request. A successful provider response must contain a tracking code to be treated as registered.

The provider-specific request/response contract should be confirmed with the National Post account before setting the production endpoint. The adapter's configurable path and payload are intentionally isolated in `shop_api/app/Services/PostalService.php` so that mapping can be adjusted without changing checkout.

## Server-owned cart

Cart contents are never persisted as product objects in browser storage. The frontend calls these API routes and receives a cart resource containing `count`, `total_quantity`, localized product data, line quantities, totals, and discount state:

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/{variant}`
- `DELETE /api/cart/items/{variant}`
- `DELETE /api/cart`
- `PATCH /api/cart/discount`

Guest carts use a random `baran_cart_session` cookie plus a session header. When the user signs in, the backend merges the guest cart into the authenticated cart. The header badge uses the resource `count` value, which is the number of cart items, not a locally calculated product total.

## Discount codes

Run the Laravel seeders after migrating to add the development code `BARAN25`. Codes are validated and stored on the server cart through `PATCH /api/cart/discount`. Checkout reads the server cart and recalculates the selected code and final total inside the stock transaction. The browser total is only a display preview.

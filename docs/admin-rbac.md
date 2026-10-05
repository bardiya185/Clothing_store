# Unified Admin Panel RBAC

The admin UI remains a single `/admin` application. Navigation and action controls are filtered by the authenticated user's permission slugs, while the backend remains the security boundary.

## Permission contract

Permissions are stored in `permissions` and assigned to roles through Spatie Permission's role-permission tables. Examples include:

- `products.view`, `products.create`, `products.update`, `products.delete`
- `orders.view`, `orders.update`
- `inventory.view`, `inventory.adjust`
- `customers.view`
- `campaigns.view`, `campaigns.create`, `campaigns.update`, `campaigns.delete`
- `discounts.view`, `discounts.create`, `discounts.update`, `discounts.delete`
- `banners.view`, `banners.create`, `banners.update`, `banners.delete`
- `roles.view`, `roles.manage`, `users.manage`

Every protected admin API route declares `EnsurePermission` independently. Unauthorized requests receive HTTP 403; frontend visibility is not treated as authorization.

## Seeded role collections

- `super_admin`
- `store_manager`
- `product_manager`
- `inventory_manager`
- `order_manager`
- `marketing_manager`
- `customer_support`

Legacy `admin`, `manager`, `inventory`, `writer`, `visual_editor`, and `content_moderator` role slugs remain as permission collections for existing assignments. The seeder migrates legacy users whose old `users.role` value was `admin` or `manager` to the corresponding collection.

Run `php artisan db:seed` after deploying the permission contract. To grant access to an existing account:

```bash
php artisan admin:promote 09120000000 --role=super_admin
```

## UI behavior

The permission context is provided by `AdminShell`. It hides navigation entries and action controls such as create, edit, delete, role assignment, shipping-method management, and homepage-section management. The same permissions are enforced again by Laravel middleware on the API routes.

Role administration uses `GET /admin/users` plus `PUT /admin/users/{user}/role` for replacing a user's current role collection, and the existing assign/revoke endpoints for additive changes. Both `roles.manage` and `users.manage` are required.

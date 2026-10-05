# Admin Panel Rebuild — Audit Before Replacement

Date: 2026-10-05

This audit was completed before deleting or replacing the existing Admin UI. No existing Admin UI file was deleted in this audit step.

## 1. Current frontend architecture

### Entry and authentication

- `frontend/app/admin/page.tsx`
  - Server-rendered entry point with `force-dynamic`.
  - Reads `access_token` and `refresh_token` cookies.
  - Probes `/admin/me` and attempts token refresh before rendering.
  - Uses `notFound()` for unauthenticated/forbidden access.
  - Does not provide an Admin-specific layout or route-level feature boundaries.
- `frontend/services/api.ts`
  - Same-origin `/api` Axios client.
  - Sends bearer token and `X-Locale`.
  - Deduplicates refresh-token requests.
  - Redirects expired browser sessions to `/login`.
- `frontend/hooks/useAuth.ts`
  - OTP login, token persistence, logout and query cache clearing.

### Current Admin UI files

- `frontend/app/admin/AdminWorkspace.tsx`
  - Approximately 1,200 lines and 141 KB.
  - Owns authentication-derived state, data loading, navigation, command search, product editor, bulk import, order details, marketing, roles, reviews, audit and cart recovery.
  - Contains all feature views as local functions in the same module.
  - This is a monolith, not a reusable feature architecture.
- `frontend/components/admin/AdminField.tsx`
  - Date/time field, generic labeled field and help card.
- `frontend/lib/admin-content.ts`
  - Slug/date helpers.
- `frontend/lib/admin-permissions.ts`
  - Client navigation permission map. It is only a visibility optimization; backend middleware remains the security boundary.
- `frontend/services/admin.service.ts`
  - All Admin DTOs and API functions in one file.
  - Existing endpoint coverage is limited to the APIs listed below.
- `frontend/app/globals.css`
  - Mostly storefront tokens plus a small set of Admin input/mobile rules.
  - No isolated Admin theme token system.

### Current UI risks

- There is no Admin route group, Admin layout, feature-level error boundary, feature-level loading boundary or server-side data boundary.
- Current loading still requests a large group of resources whenever the permission allows them; data ownership is centralized in one component.
- Search, filters and pagination are mostly component state and trigger broad reloads.
- Product editing, campaign landing editing, marketing, roles, reviews and order details are all coupled to the same module.
- The global `SiteChrome` is mounted in the root layout, so the Admin route does not have a clean application shell boundary.
- UI text is largely inline `isFa ? ... : ...`; storefront dictionaries are not an Admin feature dictionary.
- No Admin-specific automated component or interaction tests exist.

## 2. Existing Admin backend and reusable functionality

### Routes and authorization

`shop_api/routes/api.php` currently exposes:

- `/api/admin/me`
- Dashboard and audit: `/dashboard`, `/audit-logs`
- Catalog: products CRUD, image upload, bulk product import, categories read, attributes read
- Sales: abandoned carts/recovery, orders list/detail/status update
- Customers: customer list and customer orders
- Reviews: list, bulk status update, single status update, delete
- Marketing: campaigns CRUD, discounts CRUD, banners CRUD, campaign landing read/update
- Roles: roles list, assign role, revoke role

Authorization chain:

1. `auth:sanctum`
2. `EnsureAdmin`
3. `EnsurePermission` per route group

Existing permission slugs are seeded in `RolePermissionSeeder`:

- `dashboard.view`
- `products.manage`
- `inventory.manage`
- `orders.manage`
- `customers.view`
- `reviews.moderate`
- `content.write`
- `media.manage`
- `marketing.manage`
- `roles.manage`

### Reusable backend services and business logic

These must not be duplicated in the new frontend:

- `CartService`: server-owned cart, session/cart merge, stock cap, quantity cap and discount application.
- `CheckoutService`: transaction, row locking, stock decrement, order item snapshot, fake payment reference and cart clear.
- `DiscountCodeService`: the only discount calculation service; no second Coupon service should be created.
- `PostalService`: optional national-post integration; it is not currently a shipping domain.
- `CampaignService` and `ReviewService`.
- `LocaleManager`: database-backed active locale resolution and fallback chain.
- Sanctum auth/refresh flow and OTP auth.

### Reusable database models/tables

- Catalog: products, product translations, product variants, product images, attributes, attribute values, categories and translations.
- Shopping: carts, cart items, wishlists, addresses and product reviews.
- Orders: orders and order items.
- Marketing: campaigns, campaign products, campaign events, campaign landing pages, discount codes and banners.
- Access: users, roles, permissions and their pivot tables.
- Audit: admin audit logs.
- Locale: locales and currencies.
- Existing but currently unused by Admin UI: `site_settings`.

## 3. Existing Admin backend gaps relevant to the requested new panel

The following features are not currently implemented as real backend domains and must not be faked in the new UI:

| Requested area | Current state | Decision needed before schema/API work |
| --- | --- | --- |
| Brands | No Brand model/table/API found | Brand schema, translations, slug and product relation |
| Collections | No Collection model/table/API found | Collection semantics and product relation |
| Category management | Read-only Admin endpoint; no create/update/delete API | Category hierarchy, parent relation and localized workflow |
| Inventory Center | Product/variant stock exists; no inventory ledger/adjustment/history | Ledger model, adjustment reason, actor and concurrency rules |
| Payments | Checkout only has fake payment and order payment fields | Payment transaction/refund model and provider lifecycle |
| Shipping | Optional PostalService only; no shipping method/rate/status domain | Shipping methods, rates, shipment and return policy |
| Returns/refunds | No dedicated API/model found | Return/refund workflow and stock reconciliation |
| Homepage Builder | No homepage section model/API found | Section schema, block types, publishing and preview model |
| Notifications | No Admin notification model/API/event center found | Delivery channels, read state, queue and retention |
| Customer 360 | Customer list and customer orders only | Detail endpoint plus wishlist/reviews/addresses/activity aggregation |
| Global search | No backend global search endpoint | Search scope, pagination, ranking and authorization |
| Advanced analytics | Dashboard returns 7-day sales and basic metrics only | Date range, aggregation, unique customer, conversion and attribution definitions |
| Review replies | Status moderation exists; reply model/API absent | Reply ownership, visibility and moderation policy |
| Settings | `site_settings` table/model exists but no active route/UI | Public/private setting contract and permission boundary |

## 4. Data/API correctness findings

- `AdminController` is approximately 1,100 lines and combines authorization-adjacent operations, validation, persistence, aggregation, serialization and audit writes.
- Dashboard aggregation performs repeated per-day queries and does not provide previous-period comparisons, AOV, out-of-stock count, category performance or customer growth.
- Product list supports search/status/category server-side, but the current service/UI does not expose full filter, pagination and sort controls.
- Product editor supports current translation, price, stock, variants, attributes and images. The schema does not currently contain weight, brand, collection, SEO or inventory-history fields.
- `product_translations` has SEO columns in the schema, but the current Admin product API does not expose them in product rules/summary.
- Campaigns have product relations and campaign events, but the current Admin campaign payload does not expose product/category targeting workflow in a complete way.
- Discounts currently support percentage/fixed values, dates, usage limits and minimum subtotal. They do not support product/category/brand targeting or per-user usage.
- Audit logs currently store action, auditable model/id, metadata, actor and timestamp. IP/device and explicit old/new snapshots are not separate fields.
- `User::isAdmin()` grants a legacy `admin`/`manager` user all permissions. This is retained for backward compatibility but must be documented and covered during the new access-control hardening.
- `customers` filters on the legacy `users.role = customer` field; role-based customer classification and backoffice roles are separate concepts.
- Frontend API types are hand-maintained in one large service file and are not generated from a versioned API contract.

## 5. Replacement architecture

The old Admin UI will be removed after the new shell is ready; correct backend services and models will be retained.

### Proposed frontend structure

```text
frontend/app/admin/
  layout.tsx
  page.tsx
  loading.tsx
  error.tsx
  (workspace)/
    catalog/products/page.tsx
    catalog/products/[id]/page.tsx
    catalog/categories/page.tsx
    catalog/attributes/page.tsx
    inventory/page.tsx
    sales/orders/page.tsx
    sales/orders/[id]/page.tsx
    sales/customers/page.tsx
    sales/customers/[id]/page.tsx
    marketing/discounts/page.tsx
    marketing/campaigns/page.tsx
    marketing/banners/page.tsx
    content/reviews/page.tsx
    analytics/page.tsx
    administration/users/page.tsx
    administration/roles/page.tsx
    administration/activity/page.tsx
```

```text
frontend/features/admin/
  shell/
  dashboard/
  catalog/
  inventory/
  orders/
  customers/
  marketing/
  content/
  analytics/
  access/
  activity/

frontend/components/admin-ui/
  DataTable/
  CommandPalette/
  Sidebar/
  Topbar/
  Modal/
  Drawer/
  FormField/
  DateRangePicker/
  FileUploader/
  VariantMatrix/
  StatusBadge/
  ChartCard/
  Skeleton/
  EmptyState/
  ErrorState/
  ConfirmDialog/
```

### Data layer

- Use TanStack Query for server state, caching, invalidation and request deduplication.
- Keep URL search params as the source of truth for list filters, sorting and pagination.
- Use feature-specific API modules rather than one monolithic `admin.service.ts`.
- Keep mutation/business rules in the backend; frontend only validates ergonomics and submits typed DTOs.
- Introduce a shared Admin permission capability helper for route guards, menu visibility and action visibility.

### Visual system

- Add an Admin-only token layer with intentional light/dark values rather than relying on storefront tokens.
- Use glass surfaces selectively: shell, elevated cards and command palette; use opaque surfaces for dense tables and forms.
- Use a chart library only after analytics endpoint shape is defined; charts must consume real API data.
- Add direction-aware spacing and alignment using logical CSS properties. Do not implement RTL as a blind transform.

## 6. Safe deletion plan

The following can be removed after the replacement is wired and verified:

- `frontend/app/admin/AdminWorkspace.tsx`
- Old Admin-only local view functions and inline form state inside that module
- Old Admin-specific styles/classes that are unused after migration
- Admin-only imports from the old monolith

The following must be preserved or migrated deliberately:

- `frontend/app/admin/page.tsx` authentication/probe behavior, or its equivalent in the new Admin layout
- `frontend/services/api.ts` token refresh behavior
- `frontend/lib/i18n.ts` and locale persistence
- Backend Admin routes, middleware, models and correct services
- Existing product/cart/checkout/discount business logic
- Storefront-facing catalog, campaign, banner and review contracts

## 7. Verification gates before deleting the old UI

1. New Admin route renders for an authenticated admin and redirects unauthenticated users.
2. Light/dark and fa/en modes render without hydration errors.
3. Permission-restricted user cannot load restricted API endpoints directly.
4. Existing product, order, campaign, banner, discount and review operations work through the new UI.
5. Frontend lint, typecheck and production build pass.
6. Backend feature/security tests pass in a PHP/Composer environment.
7. Only after the above, remove the obsolete Admin monolith and update the final ZIP.

## 8. Current audit conclusion

A complete replacement is technically justified. The current Admin UI is a monolith and should not be incrementally beautified. However, a genuinely production-ready panel cannot honestly expose Brands, Collections, Inventory History, Payments, Shipping, Returns, Homepage Builder or Notifications until their domain contracts are decided and implemented in the backend. The replacement should therefore preserve existing healthy domains, implement the new shell and existing feature pages first, and add the missing domains through explicit migrations/API contracts rather than frontend placeholders.

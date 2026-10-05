# Phase 0 — قراردادهای تثبیت‌شده و regression guardها

این سند مرجع اجرای مرحله‌ای پروژه است. در این فاز هیچ مدل یا business flow جدیدی ساخته نمی‌شود؛ قراردادهای موجود ثبت و قابلیت‌های سالم محافظت می‌شوند.

## منابع حقیقت

| حوزه | منبع حقیقت فعلی | قاعده اجرایی |
| --- | --- | --- |
| Catalog | `products`, `product_variants`, translation tables | storefront قیمت، موجودی، وضعیت انتشار و اطلاعات localized را از API می‌گیرد. |
| Cart | `carts`, `cart_items` + `X-Cart-Session`/`baran_cart_session` | localStorage فقط session identifier است؛ snapshot کامل سبد در localStorage نگه‌داری نمی‌شود. |
| Checkout | `CheckoutService` داخل transaction | variant با `lockForUpdate` خوانده می‌شود، stock کم می‌شود، order item snapshot ساخته می‌شود و cart پاک می‌شود. |
| Discount | `DiscountCodeService` | فقط همین service معتبر است؛ Coupon/Discount system دوم اضافه نمی‌شود. |
| Admin authorization | `EnsureAdmin` + `EnsurePermission` | مخفی‌کردن منو جای authorization backend نیست؛ هر endpoint باید permission خود را enforce کند. |
| Localization | `locales`/`currencies` در backend و registry در frontend | locale/currency شرط محدود به دو مقدار نیست؛ برای locale ناشناخته fallback امن استفاده می‌شود. |
| SKU | backend normalization + default generation | SKU دستی اختیاری است؛ در نبود SKU، backend مقدار استاندارد یکتا می‌سازد. |
| Shipping | `PostalService` اختیاری | تا زمان تصمیم‌گیری درباره shipping domain، provider پست فقط integration است و checkout بدون configuration نباید بی‌دلیل fail شود. |

## قراردادهای حساس که regression test می‌شوند

### Cart

- session معتبر از `X-Cart-Session` یا cookie خوانده می‌شود و session نامعتبر به UUID جدید تبدیل می‌شود.
- quantity هر variant حداکثر ۱۰ و حداکثر stock است.
- cart مهمان پس از ورود کاربر merge می‌شود؛ variantهای ناموجود وارد cart کاربر نمی‌شوند.
- قیمت cart از قیمت فعلی variant refresh می‌شود.
- discount نامعتبر هنگام prepare شدن cart حذف می‌شود و cart خراب باقی نمی‌ماند.

### Checkout

- پرداخت فقط با کاربر authenticated و address متعلق به همان کاربر انجام می‌شود.
- checkout خالی یا stock ناکافی را رد می‌کند.
- stock و ساخت order در transaction انجام می‌شود.
- payment reference فعلی fake با prefix `FAKE-` باقی می‌ماند و به‌عنوان درگاه واقعی معرفی نمی‌شود.
- نبود تنظیمات PostalService checkout را fail نمی‌کند.

### Admin

- کاربر بدون backoffice access پاسخ ۴۰۳ می‌گیرد.
- نقش active بدون permission، به endpointهای خارج از نقش خود دسترسی ندارد.
- فراخوانی‌های Admin بر اساس permission دریافت‌شده از `/admin/me` محدود می‌شوند؛ قبل از مشخص‌شدن permissionها همه منوها visible نیستند.
- SKU در create/import اجباری دستی نیست و backend در نبود آن مقدار پیش‌فرض می‌سازد.

## Definition of Done فاز ۰

- [x] قراردادها در این سند ثبت شدند.
- [x] load اولیه Admin permission-safe شد.
- [x] registry ارز از union دو مقداری جدا شد و همچنان فیلدهای legacy `price_toman`/`price_usd` را نگه می‌دارد.
- [x] guard برای default SKU در backend اضافه شد.
- [x] تست‌های regression مربوط به session cart، سقف quantity، checkout، authorization و SKU اضافه شدند.
- [ ] اجرای واقعی `php artisan test` در محیط دارای PHP/Composer.
- [x] اجرای واقعی `npm run lint` و `npm run build` در محیط دارای dependencies frontend.

## چیزهایی که عمداً هنوز انجام نشده‌اند

- ساخت shipping method یا payment transaction جدید بدون تصمیم schema.
- فعال‌سازی Settings UI/API برای `site_settings`.
- بازسازی کامل Admin monolith در یک مرحله.
- migration برای حذف ستون‌های legacy banner/campaign.
- اضافه‌کردن notification، analytics یا inventory ledger بدون قرارداد domain و migration مستقل.

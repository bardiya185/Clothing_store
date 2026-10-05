# Baran Store Frontend

A Persian-first RTL storefront built with Next.js 16, React 19, TypeScript and Tailwind CSS v4.

## Features

- RTL Persian storefront and admin without a
- Centralized display currency: تومان
- Responsive hero, catalog, category, product detail, about and cart pages
- Server-owned cart API with guest session persistence and authenticated-cart merging
- Product cards, filtering, search, sorting and light/dark mode
- Laravel-backed catalog integration; products, filters, categories and prices come from the API

## Run locally

```bash
npm install
npm run dev
```

The browser always calls the same-origin `/api` path. Next.js proxies that path to Laravel, so phones and deployed previews never try to call their own `localhost`:

```env
NEXT_PUBLIC_API_URL=/api
API_PROXY_URL=http://127.0.0.1:8000/api
```

`NEXT_PUBLIC_API_URL` is kept as `/api`; the server-only `API_PROXY_URL` controls the Laravel destination. The Laravel API expects `?locale=fa` or `?locale=en` and returns prices in the matching currency.

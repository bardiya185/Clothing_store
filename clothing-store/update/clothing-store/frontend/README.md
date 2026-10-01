# Baran Store Frontend

A bilingual (Persian / English) storefront built with Next.js 16, React 19, TypeScript and Tailwind CSS v4.

## Features

- RTL Persian and LTR English modes with a language switcher
- Automatic display currency: تومان for Persian, USD for English
- Responsive hero, catalog, category, product detail, about and cart pages
- Server-owned cart API with guest session persistence and authenticated-cart merging
- Product cards, filtering, search, sorting and light/dark mode
- Laravel-backed catalog integration; products, filters, categories and prices come from the API

## Run locally

```bash
npm install
npm run dev
```

To connect to the Laravel API, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

The variable is required for the storefront to load data. The Laravel API expects `?locale=fa` or `?locale=en` and returns prices in the matching currency.

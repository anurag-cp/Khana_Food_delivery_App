# Khana — Neighborhood Food

Khana is a mobile-first food delivery app prototype for discovering neighborhood kitchens, browsing menus, placing a demo order, and viewing an itemized bill. Its visual style takes inspiration from restaurant bills and kitchen order slips, with warm paper colors, monospaced prices, dotted dividers, and stamped order statuses.

The sample location and restaurant content are based around Indiranagar, Bengaluru.

## Features

- Search kitchens and dishes, and filter restaurants by cuisine.
- Browse restaurant menus with item photos, vegetarian markers, and quantity controls.
- Build a cart and review itemized subtotal, coupon, delivery fee, tax, and total.
- Select UPI, Card, Wallet, or Cash on Delivery in the checkout interface.
- View an order confirmation animation and a demo tracking timeline.
- Download an itemized customer bill as a PDF on demand.
- Optionally sign in with Google through Firebase Authentication.

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3 and custom CSS
- Firebase Authentication

## Run Locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## Firebase Google Sign-In (Optional)

1. Create or open a Firebase project and register a **Web app**.
2. In Firebase Authentication, enable the Google sign-in provider.
3. Add `localhost` and your deployed website domain to Authentication's authorized domains.
4. Copy `.env.example` to `.env.local` and fill in the values from the Firebase Web app configuration:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Restart the Vite server after changing `.env.local`. The file is excluded by `.gitignore`; do not commit it. Never put a Firebase service-account private key in a client-side environment file.

The app can also be used as a guest without Firebase sign-in.

## Build and Preview

```bash
npm run build
npm run preview
```

The production build is written to `dist/`.

## Prototype Notes

This repository contains a front-end prototype. Restaurant and menu data are local sample data; cart and order state are not persisted to a backend. Payment methods are UI selections only, and order tracking does not receive live kitchen or courier updates. The PDF bill is generated in the browser from the current order snapshot. Remote food photos, Google Fonts, and Firebase scripts require an internet connection.

Before production use, connect a backend catalog and order service, persist orders, integrate and verify payments, add operational tracking, and review tax, privacy, and security requirements.

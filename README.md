# Cartenance

Cartenance is a car maintenance tracking app for vehicle owners. It includes a React PWA frontend, an Express API, SQLite persistence, photo uploads, reminders, and PDF exports.

## Features

- Email/password registration and JWT login
- Multiple vehicles per user
- Maintenance and repair history with costs, mileage, and photos
- Automatic next-maintenance prediction based on one year or 20,000 km
- Reminder settings and per-record reminders
- User settings for currency, language, and theme
- PDF vehicle report export
- PWA manifest and service worker
- Capacitor config for Android builds

## Development

Requirements:

- Node.js 18+
- npm

Install dependencies:

```bash
npm install
npm --prefix client install
```

Run the full app:

```bash
npm run dev
```

Open:

- Frontend: http://localhost:5173
- API: http://localhost:4000/api/health

## Useful Scripts

```bash
npm run client:dev
npm run server:dev
npm run build
npm run server:build
npm run check
npm run build:android
npm run open:android
```

## Data

Local runtime data is stored under `data/`:

- `data/database.sqlite`
- `data/uploads/`

The folder is ignored by Git.

## Environment

Optional server environment variables:

```bash
PORT=4000
JWT_SECRET=replace-this-in-production
```

## Android

The Capacitor app id is `com.cartenance.app`. Build web assets first, then sync Android:

```bash
npm run build:android
```

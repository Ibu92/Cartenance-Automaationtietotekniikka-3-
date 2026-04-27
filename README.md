# Cartenance

Cartenance is a locally run fullstack web application for tracking car maintenance and repair history. It is intended for car owners who want to keep vehicle records, costs, photos, and reports in one place instead of relying on paper receipts or manufacturer-specific systems.

## Features

- User registration and login
- Vehicle management
- Maintenance and repair records
- Photo upload, preview, opening, and download for records
- Cost summary in euros
- Separate cost totals for maintenance and repairs
- Next maintenance estimate based only on maintenance records
- PDF report export with vehicle details, history, and cost summary
- Finnish and English user interface
- Light and dark themes

## Scope

Cartenance is designed as a local student project. It does not connect to car manufacturers, service providers, or external systems. All maintenance and repair data is entered manually by the user. Costs are always handled in euros.

The application does not include automatic reminders, QR code sharing, a separate service personnel interface, project ZIP export, or multiple currency support.

## Technology Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express
- Database: SQLite
- Authentication: JWT and bcrypt
- File uploads: Multer
- PDF export: PDFKit

## Project Structure

```text
.
+-- client/              # React frontend
|   +-- public/          # Static assets and PWA files
|   +-- src/             # Frontend source code
+-- server/              # Express backend
|   +-- src/             # Backend source code
+-- data/                # Local runtime data, ignored by Git
+-- docs/                # Project and testing documentation
+-- package.json         # Root scripts and backend dependencies
+-- README.md
```

## Requirements

- Node.js 18 or newer
- npm
- Modern web browser

## Installation

Install root dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
npm --prefix client install
```

## Running the Application

Start the frontend and backend together:

```bash
npm run dev
```

Open the application in a browser:

```text
http://localhost:5173
```

The API runs at:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

## Useful Scripts

```bash
npm run dev
npm run client:dev
npm run server:dev
npm run build
npm run server:build
npm run check
```

## Local Data

Runtime data is stored under the `data/` directory:

- `data/database.sqlite`
- `data/uploads/`

This directory is ignored by Git because it contains local database and uploaded image data.

## Environment Variables

Optional backend environment variables:

```bash
PORT=4000
JWT_SECRET=replace-this-in-production
```

If `JWT_SECRET` is not set, the application uses a development fallback value.

## Testing

Run the TypeScript and production build check:

```bash
npm run check
```

Manual test cases are documented in [docs/TESTING.md](docs/TESTING.md).

## Documentation

- [Project documentation](docs/PROJECT_DOCUMENTATION.md)
- [Testing documentation](docs/TESTING.md)

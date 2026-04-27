# Cartenance Project Documentation

## Project Name

Cartenance - Car Maintenance and Repair Tracking Application

## Purpose

Cartenance helps car owners manage maintenance and repair history in one local browser-based application. The application reduces dependency on paper receipts, service documents, emails, and manufacturer-specific systems by storing vehicle history, costs, photos, and reports in one place.

## Target Users

The main users are car owners who want to keep track of their vehicle maintenance and repair history, related costs, and supporting photos.

## Implementation Summary

Cartenance is implemented as a fullstack web application. The frontend provides the browser user interface, while the backend handles authentication, data storage, photo uploads, and PDF report generation.

The application is intended to run locally on the user's computer. It is not published to a public cloud service and does not depend on external integrations.

## Included Functionality

- User registration and login
- Add and delete vehicles
- View all vehicles in a vehicle list
- Open a vehicle-specific history view
- Add maintenance records
- Add repair records
- Delete maintenance and repair records
- Filter records by all, maintenance, or repair
- Upload photos to records
- Open uploaded photos
- Download uploaded photos
- View total costs in euros
- View maintenance and repair costs separately
- Estimate the next maintenance based only on maintenance records
- Download a PDF report
- Use the application in Finnish or English
- Select light or dark theme

## Excluded Functionality

The project does not include:

- Automatic data fetching from car manufacturers
- External service integrations
- Automatic reminders
- QR code sharing
- Separate service personnel interface
- Project ZIP export
- Multiple currency support
- Cloud deployment
- Email-based password reset

## Technologies

### Frontend

- React
- TypeScript
- Vite
- React Router
- Lucide React icons

### Backend

- Node.js
- Express
- SQLite
- Kysely
- JWT authentication
- bcrypt password hashing
- Multer file uploads
- PDFKit PDF generation

## Data

The application stores the following main data:

- User account: email, hashed password, language, theme
- Vehicle: name, brand, model, year, owner
- Record: vehicle, date, odometer reading, title, description, type, cost in euros
- Photo: related record, uploaded file name, upload time

Uploaded files and the SQLite database are stored locally in the `data/` directory.

## Security Notes

- Passwords are hashed with bcrypt.
- Protected API routes require a JWT token.
- Users can only access their own vehicles and records.
- Uploaded files are validated by MIME type and file size.
- Local runtime data is not committed to Git.

## Running the Project

Install dependencies:

```bash
npm install
npm --prefix client install
```

Start development mode:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Build and Verification

Run:

```bash
npm run check
```

This builds the backend TypeScript project and the frontend production bundle.

## Limitations

Cartenance is a student project and is intended for local demonstration use. It is not hardened for public internet deployment. Password recovery is not implemented, and maintenance estimates use a simple rule based on the latest maintenance record rather than manufacturer-specific service schedules.

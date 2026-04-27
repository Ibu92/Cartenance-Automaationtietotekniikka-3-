import DatabaseDriver from "better-sqlite3";
import { Kysely, SqliteDialect, sql } from "kysely";
import fs from "node:fs";
import path from "node:path";
import type { Database } from "./types.js";

export const dataDir = path.resolve(process.cwd(), "data");
export const uploadDir = path.join(dataDir, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const sqlite = new DatabaseDriver(path.join(dataDir, "database.sqlite"));
sqlite.pragma("foreign_keys = ON");

export const db = new Kysely<Database>({
  dialect: new SqliteDialect({ database: sqlite })
});

export async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      defaultCurrency TEXT NOT NULL DEFAULT 'EUR',
      language TEXT NOT NULL DEFAULT 'en',
      theme TEXT NOT NULL DEFAULT 'dark',
      createdAt TEXT NOT NULL
    )
  `.execute(db);

  await sql`UPDATE users SET theme = 'dark' WHERE theme = 'system'`.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(userId, name)
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carId INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      kilometers INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      cost REAL,
      type TEXT NOT NULL DEFAULT 'maintenance',
      currency TEXT NOT NULL DEFAULT 'EUR',
      createdAt TEXT NOT NULL
    )
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS maintenance_car_idx ON maintenance(carId)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS maintenance_date_idx ON maintenance(date)`.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      maintenanceId INTEGER NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
      fileName TEXT NOT NULL,
      uploadedAt TEXT NOT NULL
    )
  `.execute(db);

  await sql`CREATE INDEX IF NOT EXISTS photos_maintenance_idx ON photos(maintenanceId)`.execute(db);

}

export const now = () => new Date().toISOString();

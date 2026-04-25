import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export type Currency = "EUR" | "USD" | "GBP" | "JPY" | "THB" | "INR";
export type Language = "en" | "fi";
export type Theme = "light" | "dark" | "system";
export type MaintenanceType = "maintenance" | "repair";
export type ReminderType = "date" | "mileage" | "both";

export interface Database {
  users: UserTable;
  cars: CarTable;
  maintenance: MaintenanceTable;
  photos: PhotoTable;
  reminder_settings: ReminderSettingsTable;
  maintenance_reminders: MaintenanceReminderTable;
}

export interface UserTable {
  id: Generated<number>;
  email: string;
  password: string;
  defaultCurrency: Currency;
  language: Language;
  theme: Theme;
  createdAt: string;
}

export interface CarTable {
  id: Generated<number>;
  userId: number;
  name: string;
  brand: string;
  model: string;
  year: number;
  createdAt: string;
}

export interface MaintenanceTable {
  id: Generated<number>;
  carId: number;
  date: string;
  kilometers: number;
  title: string;
  description: string;
  cost: number | null;
  type: MaintenanceType;
  currency: Currency;
  createdAt: string;
}

export interface PhotoTable {
  id: Generated<number>;
  maintenanceId: number;
  fileName: string;
  uploadedAt: string;
}

export interface ReminderSettingsTable {
  id: Generated<number>;
  userId: number;
  emailEnabled: number;
  pushEnabled: number;
  email: string | null;
  daysBeforeReminder: number;
  kmBeforeReminder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceReminderTable {
  id: Generated<number>;
  maintenanceId: number;
  reminderType: ReminderType;
  reminderDate: string | null;
  reminderKm: number | null;
  snoozedUntil: string | null;
  snoozedKmUntil: number | null;
  lastNotifiedAt: string | null;
  isActive: number;
  createdAt: string;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

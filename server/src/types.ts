import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export type Currency = "EUR" | "USD" | "GBP" | "JPY" | "THB" | "INR";
export type Language = "en" | "fi";
export type Theme = "light" | "dark" | "system";
export type MaintenanceType = "maintenance" | "repair";

export interface Database {
  users: UserTable;
  cars: CarTable;
  maintenance: MaintenanceTable;
  photos: PhotoTable;
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

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

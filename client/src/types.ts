export type Currency = "EUR" | "USD" | "GBP" | "JPY" | "THB" | "INR";
export type Language = "en" | "fi";
export type Theme = "light" | "dark" | "system";
export type MaintenanceType = "maintenance" | "repair";

export type User = {
  id: number;
  email: string;
  defaultCurrency: Currency;
  language: Language;
  theme: Theme;
};

export type Car = {
  id: number;
  userId: number;
  name: string;
  brand: string;
  model: string;
  year: number;
  createdAt: string;
  recordCount: number;
  totalCost: number;
  maxKm: number;
  lastServiceDate: string | null;
};

export type Photo = { id: number; maintenanceId: number; fileName: string; uploadedAt: string };
export type Reminder = {
  id: number;
  maintenanceId: number;
  reminderType: "date" | "mileage" | "both";
  reminderDate: string | null;
  reminderKm: number | null;
  snoozedUntil: string | null;
  snoozedKmUntil: number | null;
  isActive: number;
};

export type MaintenanceRecord = {
  id: number;
  carId: number;
  date: string;
  kilometers: number;
  title: string;
  description: string;
  cost: number | null;
  type: MaintenanceType;
  currency: Currency;
  photos: Photo[];
  reminders: Reminder[];
};

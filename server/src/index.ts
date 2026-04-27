import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { requireAuth, requireCarOwner, signToken, type AuthedRequest } from "./auth.js";
import { db, migrate, now, uploadDir } from "./db.js";
import { upload } from "./upload.js";
import type { Currency, Language, Theme } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadDir));

const currencySchema = z.enum(["EUR", "USD", "GBP", "JPY", "THB", "INR"]);
const maintenanceTypeSchema = z.enum(["maintenance", "repair"]);
const authSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const pdfText = {
  en: {
    report: "maintenance report",
    vehicle: "Vehicle",
    history: "Maintenance history",
    kilometers: "Kilometers",
    type: "Type",
    cost: "Cost",
    maintenance: "Maintenance",
    repair: "Repair",
    noRecords: "No maintenance records yet",
    fileSuffix: "maintenance",
    totalCosts: "Total costs",
    serviceCosts: "Maintenance costs",
    repairCosts: "Repair costs"
  },
  fi: {
    report: "huoltoraportti",
    vehicle: "Ajoneuvo",
    history: "Huoltohistoria",
    kilometers: "Kilometrit",
    type: "Tyyppi",
    cost: "Hinta",
    maintenance: "Huolto",
    repair: "Korjaus",
    noRecords: "Ei huoltomerkintöjä",
    fileSuffix: "huoltoraportti",
    totalCosts: "Kulut yhteensä",
    serviceCosts: "Huoltokulut",
    repairCosts: "Korjauskulut"
  }
} satisfies Record<Language, Record<string, string>>;

function publicUser(user: { id: number; email: string; defaultCurrency: Currency; language: Language; theme: Theme }) {
  return { id: user.id, email: user.email, defaultCurrency: user.defaultCurrency, language: user.language, theme: user.theme };
}

async function ownsMaintenance(userId: number, maintenanceId: number) {
  const row = await db
    .selectFrom("maintenance")
    .innerJoin("cars", "cars.id", "maintenance.carId")
    .select(["maintenance.id"])
    .where("maintenance.id", "=", maintenanceId)
    .where("cars.userId", "=", userId)
    .executeTakeFirst();
  return Boolean(row);
}

app.post("/api/auth/register", async (req, res) => {
  const body = authSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Valid email and 8 character password required" });

  const hash = await bcrypt.hash(body.data.password, 12);
  try {
    const user = await db
      .insertInto("users")
      .values({ email: body.data.email.toLowerCase(), password: hash, defaultCurrency: "EUR", language: "en", theme: "dark", createdAt: now() })
      .returning(["id", "email", "defaultCurrency", "language", "theme"])
      .executeTakeFirstOrThrow();
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch {
    res.status(409).json({ error: "Email already registered" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const body = authSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid credentials" });
  const user = await db.selectFrom("users").selectAll().where("email", "=", body.data.email.toLowerCase()).executeTakeFirst();
  if (!user || !(await bcrypt.compare(body.data.password, user.password))) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get("/api/user/settings", requireAuth, async (req: AuthedRequest, res) => {
  const user = await db.selectFrom("users").select(["id", "email", "defaultCurrency", "language", "theme"]).where("id", "=", req.user!.id).executeTakeFirstOrThrow();
  res.json(publicUser(user));
});

app.put("/api/user/settings", requireAuth, async (req: AuthedRequest, res) => {
  const body = z.object({ defaultCurrency: currencySchema, language: z.enum(["en", "fi"]), theme: z.enum(["light", "dark"]) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid settings" });
  const user = await db.updateTable("users").set(body.data).where("id", "=", req.user!.id).returning(["id", "email", "defaultCurrency", "language", "theme"]).executeTakeFirstOrThrow();
  res.json(publicUser(user));
});

app.get("/api/cars", requireAuth, async (req: AuthedRequest, res) => {
  const cars = await db.selectFrom("cars").selectAll().where("userId", "=", req.user!.id).orderBy("createdAt", "desc").execute();
  const result = await Promise.all(cars.map(async (car) => {
    const records = await db.selectFrom("maintenance").selectAll().where("carId", "=", car.id).orderBy("date", "desc").execute();
    const maxKm = records.reduce((max, row) => Math.max(max, row.kilometers), 0);
    const totalCost = records.reduce((sum, row) => sum + (row.cost ?? 0), 0);
    const last = records[0];
    return { ...car, recordCount: records.length, totalCost, maxKm, lastServiceDate: last?.date ?? null };
  }));
  res.json(result);
});

app.post("/api/cars", requireAuth, async (req: AuthedRequest, res) => {
  const body = z.object({ name: z.string().min(1), brand: z.string().min(1), model: z.string().min(1), year: z.number().int().min(1900).max(2100) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid car details" });
  try {
    const car = await db.insertInto("cars").values({ ...body.data, userId: req.user!.id, createdAt: now() }).returningAll().executeTakeFirstOrThrow();
    res.json(car);
  } catch {
    res.status(409).json({ error: "Vehicle name already exists" });
  }
});

app.delete("/api/cars/:id", requireAuth, async (req: AuthedRequest, res) => {
  await db.deleteFrom("cars").where("id", "=", Number(req.params.id)).where("userId", "=", req.user!.id).execute();
  res.json({ ok: true });
});

app.get("/api/maintenance/:carId", requireAuth, requireCarOwner, async (req, res) => {
  const rows = await db.selectFrom("maintenance").selectAll().where("carId", "=", Number(req.params.carId)).orderBy("date", "desc").execute();
  const withPhotos = await Promise.all(rows.map(async (row) => ({
    ...row,
    photos: await db.selectFrom("photos").selectAll().where("maintenanceId", "=", row.id).execute()
  })));
  res.json(withPhotos);
});

app.post("/api/maintenance/:carId", requireAuth, requireCarOwner, async (req: AuthedRequest, res) => {
  const body = z.object({
    date: z.string().min(4),
    kilometers: z.number().int().min(0),
    title: z.string().min(1),
    description: z.string().min(1),
    cost: z.number().min(0).nullable().optional(),
    type: maintenanceTypeSchema.default("maintenance"),
    currency: currencySchema.default("EUR")
  }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid maintenance record" });
  const row = await db.insertInto("maintenance").values({ ...body.data, cost: body.data.cost ?? null, carId: Number(req.params.carId), createdAt: now() }).returningAll().executeTakeFirstOrThrow();
  res.json(row);
});

app.delete("/api/maintenance/:id", requireAuth, async (req: AuthedRequest, res) => {
  if (!(await ownsMaintenance(req.user!.id, Number(req.params.id)))) return res.status(404).json({ error: "Record not found" });
  await db.deleteFrom("maintenance").where("id", "=", Number(req.params.id)).execute();
  res.json({ ok: true });
});

app.post("/api/maintenance/:maintenanceId/photos", requireAuth, upload.array("photos", 5), async (req: AuthedRequest, res) => {
  const maintenanceId = Number(req.params.maintenanceId);
  if (!(await ownsMaintenance(req.user!.id, maintenanceId))) return res.status(404).json({ error: "Record not found" });
  const files = (req.files as Express.Multer.File[]) ?? [];
  const rows = await Promise.all(files.map((file) => db.insertInto("photos").values({ maintenanceId, fileName: file.filename, uploadedAt: now() }).returningAll().executeTakeFirstOrThrow()));
  res.json(rows);
});

app.get("/api/maintenance/:maintenanceId/photos", requireAuth, async (req: AuthedRequest, res) => {
  const maintenanceId = Number(req.params.maintenanceId);
  if (!(await ownsMaintenance(req.user!.id, maintenanceId))) return res.status(404).json({ error: "Record not found" });
  res.json(await db.selectFrom("photos").selectAll().where("maintenanceId", "=", maintenanceId).execute());
});

app.delete("/api/photos/:photoId", requireAuth, async (req: AuthedRequest, res) => {
  const photo = await db.selectFrom("photos").innerJoin("maintenance", "maintenance.id", "photos.maintenanceId").innerJoin("cars", "cars.id", "maintenance.carId").select(["photos.id", "photos.fileName"]).where("photos.id", "=", Number(req.params.photoId)).where("cars.userId", "=", req.user!.id).executeTakeFirst();
  if (!photo) return res.status(404).json({ error: "Photo not found" });
  await db.deleteFrom("photos").where("id", "=", photo.id).execute();
  fs.rm(path.join(uploadDir, photo.fileName), { force: true }, () => undefined);
  res.json({ ok: true });
});

app.get("/api/service/:carId/car", async (req, res) => {
  const car = await db.selectFrom("cars").select(["id", "name", "brand", "model", "year"]).where("id", "=", Number(req.params.carId)).executeTakeFirst();
  if (!car) return res.status(404).json({ error: "Vehicle not found" });
  res.json(car);
});

app.post("/api/service/:carId/maintenance", async (req, res) => {
  const car = await db.selectFrom("cars").select(["id"]).where("id", "=", Number(req.params.carId)).executeTakeFirst();
  if (!car) return res.status(404).json({ error: "Vehicle not found" });
  const body = z.object({ date: z.string(), kilometers: z.number().int().min(0), title: z.string().min(1), description: z.string().min(1), cost: z.number().min(0).nullable().optional(), type: maintenanceTypeSchema.default("maintenance"), currency: currencySchema.default("EUR") }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid maintenance record" });
  const row = await db.insertInto("maintenance").values({ ...body.data, cost: body.data.cost ?? null, carId: car.id, createdAt: now() }).returningAll().executeTakeFirstOrThrow();
  res.json(row);
});

app.post("/api/service/:maintenanceId/photos", upload.array("photos", 5), async (req, res) => {
  const maintenance = await db.selectFrom("maintenance").select(["id"]).where("id", "=", Number(req.params.maintenanceId)).executeTakeFirst();
  if (!maintenance) return res.status(404).json({ error: "Record not found" });
  const files = (req.files as Express.Multer.File[]) ?? [];
  const rows = await Promise.all(files.map((file) => db.insertInto("photos").values({ maintenanceId: maintenance.id, fileName: file.filename, uploadedAt: now() }).returningAll().executeTakeFirstOrThrow()));
  res.json(rows);
});

app.get("/api/export/pdf/:carId", requireAuth, requireCarOwner, async (req, res) => {
  const car = await db.selectFrom("cars").selectAll().where("id", "=", Number(req.params.carId)).executeTakeFirstOrThrow();
  const rows = await db.selectFrom("maintenance").selectAll().where("carId", "=", car.id).orderBy("date", "desc").execute();
  const user = await db.selectFrom("users").select(["language", "defaultCurrency"]).where("id", "=", (req as AuthedRequest).user!.id).executeTakeFirstOrThrow();
  const language = user.language;
  const text = pdfText[language];
  const locale = language === "fi" ? "fi-FI" : "en-US";
  const formatDate = (value: string) => new Intl.DateTimeFormat(locale).format(new Date(value));
  const formatCost = (cost: number | null, currency: Currency) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(cost ?? 0);
  const reportCurrency = rows[0]?.currency ?? user.defaultCurrency;
  const totalCosts = rows.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const serviceCosts = rows.filter((row) => row.type === "maintenance").reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const repairCosts = rows.filter((row) => row.type === "repair").reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const safeName = car.name.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "vehicle";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}-${text.fileSuffix}.pdf"`);
  const doc = new PDFDocument({ margin: 48 });
  doc.pipe(res);
  doc.fontSize(22).text(`${car.name} ${text.report}`);
  doc.moveDown().fontSize(12).text(`${text.vehicle}: ${car.brand} ${car.model} (${car.year})`);
  doc.moveDown();
  doc.fontSize(15).text(text.totalCosts);
  doc.fontSize(10).text(`${text.totalCosts}: ${formatCost(totalCosts, reportCurrency)}`);
  doc.text(`${text.serviceCosts}: ${formatCost(serviceCosts, reportCurrency)}`);
  doc.text(`${text.repairCosts}: ${formatCost(repairCosts, reportCurrency)}`);
  doc.moveDown();

  if (!rows.length) {
    doc.fontSize(12).text(text.noRecords);
  }

  rows.forEach((row) => {
    doc.fontSize(14).text(`${formatDate(row.date)} - ${row.title}`);
    doc.fontSize(10).text(`${text.kilometers}: ${row.kilometers.toLocaleString(locale)} km | ${text.type}: ${text[row.type]} | ${text.cost}: ${formatCost(row.cost, row.currency)}`);
    doc.text(row.description).moveDown();
  });
  doc.end();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

await migrate();
app.listen(port, () => console.log(`Cartenance API running on http://localhost:${port}`));

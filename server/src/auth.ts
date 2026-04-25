import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db.js";

export const jwtSecret = process.env.JWT_SECRET ?? "cartenance-dev-secret";

export interface AuthedRequest extends Request {
  user?: { id: number; email: string };
}

export function signToken(user: { id: number; email: string }) {
  return jwt.sign(user, jwtSecret, { expiresIn: "7d" });
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, jwtSecret) as { id: number; email: string };
    const user = await db.selectFrom("users").select(["id", "email"]).where("id", "=", payload.id).executeTakeFirst();
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireCarOwner(req: AuthedRequest, res: Response, next: NextFunction) {
  const carId = Number(req.params.carId ?? req.params.id);
  const car = await db.selectFrom("cars").selectAll().where("id", "=", carId).executeTakeFirst();
  if (!car || car.userId !== req.user?.id) return res.status(404).json({ error: "Car not found" });
  next();
}

import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { uploadDir } from "./db.js";

const allowed = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => cb(null, allowed.has(file.mimetype))
});

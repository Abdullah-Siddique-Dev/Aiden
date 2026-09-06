import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { db } from "../db.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "aiden-dev-secret-change-me";

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
}

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

router.post("/signup", (req, res) => {
  const { name, email, password, disability_type, language } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const id = nanoid();
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, disability_type, language)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, email, password_hash, disability_type || "none", language || "en");

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

router.get("/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

router.put("/me", authMiddleware, (req, res) => {
  const { name, language, font_size, high_contrast, disability_type, avatar_color } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  db.prepare(
    `UPDATE users SET name=?, language=?, font_size=?, high_contrast=?, disability_type=?, avatar_color=? WHERE id=?`
  ).run(
    name ?? user.name,
    language ?? user.language,
    font_size ?? user.font_size,
    high_contrast ?? user.high_contrast,
    disability_type ?? user.disability_type,
    avatar_color ?? user.avatar_color,
    req.userId
  );
  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  res.json({ user: publicUser(updated) });
});

export default router;
export { JWT_SECRET, publicUser };

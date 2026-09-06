import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware, publicUser } from "./auth.js";

const router = Router();

router.get("/search", authMiddleware, (req, res) => {
  const q = `%${(req.query.q || "").toLowerCase()}%`;
  const rows = db
    .prepare(
      `SELECT * FROM users WHERE id != ? AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?) LIMIT 20`
    )
    .all(req.userId, q, q);
  res.json({ users: rows.map(publicUser) });
});

export default router;

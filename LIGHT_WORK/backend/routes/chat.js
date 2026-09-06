import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { authMiddleware } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const kind = req.body.type === "voice" ? "voice" : req.body.type === "video" ? "video" : "image";
    cb(null, path.join(__dirname, "..", "uploads", kind));
  },
  filename: (req, file, cb) => cb(null, `${nanoid()}${path.extname(file.originalname) || ""}`),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

function conversationIdFor(a, b) {
  return [a, b].sort().join("_");
}

router.get("/conversations", authMiddleware, (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM conversations WHERE user_a = ? OR user_b = ?`)
    .all(req.userId, req.userId);

  const result = rows.map((c) => {
    const otherId = c.user_a === req.userId ? c.user_b : c.user_a;
    const other = db.prepare("SELECT id, name, email, avatar_color FROM users WHERE id = ?").get(otherId);
    const last = db
      .prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`)
      .get(c.id);
    return { id: c.id, with: other, lastMessage: last || null };
  });
  res.json({ conversations: result });
});

router.post("/conversations/start", authMiddleware, (req, res) => {
  const { userId: otherId } = req.body;
  if (!otherId) return res.status(400).json({ error: "userId is required" });
  const id = conversationIdFor(req.userId, otherId);
  const existing = db.prepare("SELECT * FROM conversations WHERE id = ?").get(id);
  if (!existing) {
    db.prepare(`INSERT INTO conversations (id, user_a, user_b) VALUES (?, ?, ?)`).run(id, req.userId, otherId);
  }
  res.json({ conversationId: id });
});

router.get("/conversations/:id/messages", authMiddleware, (req, res) => {
  const conversation = db.prepare("SELECT * FROM conversations WHERE id = ?").get(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  if (conversation.user_a !== req.userId && conversation.user_b !== req.userId) {
    return res.status(403).json({ error: "Not a participant in this conversation" });
  }

  const rows = db
    .prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`)
    .all(req.params.id);
  res.json({ messages: rows });
});

router.post("/upload", authMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const kind = req.body.type === "voice" ? "voice" : req.body.type === "video" ? "video" : "image";
  res.json({ url: `/uploads/${kind}/${req.file.filename}` });
});

const DETECTION_KINDS = new Set(["sign", "currency", "text", "object"]);

// Called by "Detect & Send" inside an open chat (Task 1). Stores a
// detection result as its own message row and broadcasts it via Socket.io
// to both sides of the conversation, same as a normal chat message, so
// both users see it as text and can hear it spoken in their own language.
router.post("/conversations/:id/detect", authMiddleware, (req, res) => {
  const { label, kind, confidence } = req.body;
  if (!label || typeof label !== "string") return res.status(400).json({ error: "label is required" });
  if (!DETECTION_KINDS.has(kind)) return res.status(400).json({ error: "kind must be one of sign|currency|text|object" });

  const conversation = db.prepare("SELECT * FROM conversations WHERE id = ?").get(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  if (conversation.user_a !== req.userId && conversation.user_b !== req.userId) {
    return res.status(403).json({ error: "Not a participant in this conversation" });
  }

  const id = nanoid();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, type, content, detection_kind, detection_confidence) VALUES (?, ?, ?, 'detection', ?, ?, ?)`
  ).run(id, req.params.id, req.userId, label, kind, typeof confidence === "number" ? confidence : null);

  const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(id);
  req.app.locals.io?.to(`conv:${req.params.id}`).emit("chat:message", message);
  res.json({ message });
});

export default router;

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

import { db } from "./db.js";
import authRoutes, { JWT_SECRET } from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chat.js";
import agentRoutes from "./routes/agent.js";
import signRoutes from "./routes/signs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
app.locals.io = io; // so REST routes (e.g. POST /api/chat/conversations/:id/detect) can broadcast too

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/signs", signRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, name: "AIDEN backend" }));

// ---------- Socket.io: auth, chat, typing, WebRTC signaling ----------
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  onlineUsers.set(socket.userId, socket.id);
  socket.join(`user:${socket.userId}`);
  io.emit("presence", { userId: socket.userId, online: true });

  socket.on("chat:join", ({ conversationId } = {}) => {
    if (conversationId) socket.join(`conv:${conversationId}`);
  });

  socket.on("chat:typing", ({ conversationId, isTyping } = {}) => {
    if (conversationId) socket.to(`conv:${conversationId}`).emit("chat:typing", { userId: socket.userId, isTyping });
  });

  socket.on("chat:message", ({ conversationId, type, content, detectionKind, detectionConfidence } = {}) => {
    // Reject missing conversationId, empty, or whitespace‑only messages
    if (!conversationId || !content || !content.trim()) {
      socket.emit("error", { error: "Message cannot be empty" });
      return;
    }
    try {
      const id = nanoid();
      db.prepare(
        `INSERT INTO messages (id, conversation_id, sender_id, type, content, detection_kind, detection_confidence) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(id, conversationId, socket.userId, type || "text", content, detectionKind || null, detectionConfidence ?? null);
      const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(id);
      io.to(`conv:${conversationId}`).emit("chat:message", message);
    } catch (err) {
      console.error("chat:message error:", err.message);
      socket.emit("error", { error: "Failed to send message" });
    }
  });

  // ---- WebRTC signaling for voice/video calls ----
  socket.on("call:invite", ({ toUserId, conversationId, callType } = {}) => {
    if (!toUserId) return;
    const target = onlineUsers.get(toUserId);
    if (target) {
      io.to(target).emit("call:invite", { fromUserId: socket.userId, conversationId, callType });
    } else {
      socket.emit("call:unavailable", { toUserId });
    }
  });

  socket.on("call:accept", ({ toUserId } = {}) => {
    if (!toUserId) return;
    const target = onlineUsers.get(toUserId);
    if (target) io.to(target).emit("call:accept", { fromUserId: socket.userId });
  });

  socket.on("call:reject", ({ toUserId } = {}) => {
    if (!toUserId) return;
    const target = onlineUsers.get(toUserId);
    if (target) io.to(target).emit("call:reject", { fromUserId: socket.userId });
  });

  socket.on("call:signal", ({ toUserId, signal } = {}) => {
    if (!toUserId) return;
    const target = onlineUsers.get(toUserId);
    if (target) io.to(target).emit("call:signal", { fromUserId: socket.userId, signal });
  });

  socket.on("call:end", ({ toUserId } = {}) => {
    if (!toUserId) return;
    const target = onlineUsers.get(toUserId);
    if (target) io.to(target).emit("call:end", { fromUserId: socket.userId });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId);
    io.emit("presence", { userId: socket.userId, online: false });
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`AIDEN backend listening on :${PORT}`));

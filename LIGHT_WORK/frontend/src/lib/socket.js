import { io } from "socket.io-client";

let socket = null;

export function getSocket(token) {
  if (socket) return socket;
  socket = io("/", { path: "/socket.io", auth: { token }, autoConnect: true });
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}

import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:7891";

let socket: Socket | null = null;

export function getSocket(restaurantId: string): Socket {
  // Return existing connected socket
  if (socket?.connected) return socket;

  // Clean up old disconnected socket before creating new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  socket = io(SOCKET_URL, {
    query: { restaurantId },
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

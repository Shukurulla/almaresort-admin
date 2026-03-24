"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "@/lib/socket";

export function useSocket(restaurantId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;

    const socket = getSocket(restaurantId);
    socketRef.current = socket;

    const onConnect = () => {
      socket.emit("join:restaurant", { restaurantId });
      setConnected(true);
    };

    const onDisconnect = () => setConnected(false);

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      disconnectSocket();
      setConnected(false);
    };
  }, [restaurantId]);

  return { socketRef, connected };
}

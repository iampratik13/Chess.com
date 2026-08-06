import { useEffect, useState } from "react";

// The game server URL is injected at build time. In production (Vercel) set
// VITE_WS_URL to the Railway backend, e.g. wss://your-app.up.railway.app.
// Falls back to the local dev server so `npm run dev` works with no config.
const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setSocket(ws);
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed", event.code, event.reason);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      console.log("Cleaning up WebSocket connection");
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []);

  return socket;
};
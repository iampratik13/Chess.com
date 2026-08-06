import { createServer, type IncomingMessage } from 'http';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager.js';

// Railway (and most PaaS) inject the port to bind on. Fall back to 8080 locally.
const PORT = Number(process.env.PORT) || 8080;

// Optional comma-separated origin allowlist (e.g. the Vercel domain). When set,
// browser connections from any other origin are rejected during the WS upgrade.
// Leave unset to allow all origins (handy for local dev and non-browser clients).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const originAllowed = (origin: string | undefined): boolean => {
  if (ALLOWED_ORIGINS.length === 0) return true;
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
};

// A bare WebSocket server has no HTTP surface for platform health checks, so we
// run WS on top of an HTTP server that answers GET /health with 200.
const httpServer = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({
  server: httpServer,
  verifyClient: ({ origin }: { origin?: string }) => originAllowed(origin),
});

const gameManager = new GameManager();

wss.on('connection', (ws, req: IncomingMessage) => {
  console.log('New client connected from', req.socket.remoteAddress);
  gameManager.addUser(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
    gameManager.removeUser(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Game server listening on port ${PORT}`);
  if (ALLOWED_ORIGINS.length > 0) {
    console.log('Allowed origins:', ALLOWED_ORIGINS.join(', '));
  }
});

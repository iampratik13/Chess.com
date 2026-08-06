# ♞ Gambit

A real-time multiplayer chess app play a random opponent or a friend over a
private room, with move validation and game history. Built as a TypeScript
monorepo with a shared, fully-typed WebSocket protocol.

## Features

- **Real-time play** over WebSockets with server-authoritative move validation
- **Random matchmaking** and **private rooms** (shareable 6-character codes)
- **Google / email authentication** (Firebase Auth)
- **Game history & stats** persisted to Firestore, with stale-while-revalidate loading
- Board experience: legal-move hints, last-move & check highlights, promotion,
  board flipping, resign, and disconnect handling
- Responsive, mobile-first UI with a warm, handcrafted design system

## Tech stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router   |
| Backend  | Node.js, `ws` (WebSocket), `chess.js`                       |
| Shared   | `@chess/protocol` — typed message contract used by both ends |
| Services | Firebase Auth + Firestore                                   |

## Monorepo layout

```
packages/protocol   # Shared, typed client/server message contract
backend             # WebSocket game server (matchmaking, rooms, game state)
frontend            # React client
```

The shared protocol is the single source of truth for every WebSocket message,
so the client and server can never drift out of sync.

## Getting started

```bash
# Install all workspaces
npm install

# Build the shared protocol (needed once before running the backend)
npm run build:protocol

# In separate terminals:
npm run dev:backend    # ws://localhost:8080
npm run dev:frontend   # http://localhost:5173
```

Copy `frontend/.env.example` to `frontend/.env` and fill in your Firebase web
app credentials (and optionally `VITE_WS_URL`). The backend reads `PORT` and an
optional `ALLOWED_ORIGINS` — see `backend/.env.example`.

## Deployment

The app is designed to deploy as a split: static frontend on **Vercel**,
WebSocket backend on **Railway**.

### Backend → Railway

Create a service from this repo. `railway.json` already sets the build and start
commands (build the shared protocol, then the backend) and a `/health` check.
Set these variables:

| Variable          | Value                                             |
| ----------------- | ------------------------------------------------- |
| `ALLOWED_ORIGINS` | Your Vercel URL, e.g. `https://your-app.vercel.app` |

Railway injects `PORT` automatically; the server binds it and exposes `/health`.
Note the public domain — you'll point the frontend at it over `wss://`.

### Frontend → Vercel

Import the repo. `vercel.json` sets the build (`npm run build -w frontend`),
output directory, and SPA rewrites. Set these variables:

| Variable         | Value                                          |
| ---------------- | ---------------------------------------------- |
| `VITE_WS_URL`    | `wss://<your-railway-domain>`                  |
| `VITE_FIREBASE_*`| Your Firebase web app credentials (see `.env.example`) |

Deploy the backend first so you have its domain for `VITE_WS_URL`.

## Scripts (root)

| Script                   | Description                            |
| ------------------------ | ------------------------------------- |
| `npm run build`          | Build protocol, backend, and frontend |
| `npm run dev:frontend`   | Start the Vite dev server             |
| `npm run dev:backend`    | Compile and run the game server       |
| `npm run build:protocol` | Build the shared protocol package     |

## Architecture notes

- **Server-authoritative**: the backend validates turn order and legality with
  `chess.js` and decides every outcome; the client renders and mirrors state.
- **No stale closures**: game state lives in a single `chess.js` instance behind
  a ref (`useChessGame`), and the socket listener is attached once per socket.
- **Self-contained game lifecycle**: finished games remove themselves from the
  manager, so the server never leaks memory.

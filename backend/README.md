# Backend API (`backend`)

This folder contains the independent Node.js API for social profile imports. It uses Node's built-in HTTP server and has no external runtime dependencies.

## Run locally from the frontend folder

1. Copy `backend/.env.example` to `backend/.env` and add API credentials there.
2. Run `npm run dev:api` from either `frontend/` or `backend/`. The API listens on `http://localhost:3001`.
3. The Vite app proxies `/api` calls to this local API.

For compatibility with the earlier setup, local startup also reads `frontend/.env`; values in `backend/.env` take precedence. New backend credentials should go in `backend/.env`.

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the backend environment. The API checks each profile-import access token with Supabase Auth before handling the request. Do not use or expose a service-role key for this flow.

You can also run `npm run dev` from `backend/`. Run backend tests with `npm test` from `backend/` or `npm test` from `frontend/`.

## Deploy separately

Deploy this folder as a Node.js web service on a host that supports a long-running Node process. Set the service root to `backend`, start command to `npm start`, and configure the backend environment variables in that host's dashboard. Do not copy secrets into frontend variables or source control.

For a separate frontend and backend origin, set:

- Backend `APP_ORIGIN` to the exact public frontend origin, such as `https://your-dashboard.vercel.app`.
- Backend `API_ORIGIN` to the backend origin, such as `https://your-api-host.example`.
- Frontend build variable `VITE_API_URL` to that same backend origin.
- Meta/TikTok redirect URI to the backend origin plus `/api/oauth/{platform}/callback`.

The backend allows browser API requests only from the configured `APP_ORIGIN`. For local development, keep `APP_ORIGIN=http://localhost:5173` and leave `API_ORIGIN` empty. Set `VITE_API_URL` in `frontend/.env` only when the frontend and backend have separate public origins.

The current backend entry point runs a Node HTTP server. It is suitable for a regular Node service; deploying it as Vercel Functions requires converting the routes to function handlers and moving OAuth state/rate-limit state to shared storage.

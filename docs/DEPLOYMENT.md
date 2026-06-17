# Deployment Guide

This repository is designed to deploy from the root.

## Deployment Source Of Truth

- Build command: `npm run build`
- Start command: `npm start`
- Server entry: `server/server.js`
- Client build output: `client/dist`

## Environment Variables

### Backend

Create `server/.env` from `server/.env.example`.

Required:

- `MONGO_URI`: MongoDB connection string

Optional:

- `PORT`: server port, defaults to `5000`

### Frontend

Create `client/.env` only if you need environment overrides.

Optional:

- `VITE_API_URL`: frontend API base, defaults to `/api/workspaces`
- `VITE_DEV_API_TARGET`: dev proxy target for Vite, defaults to `http://localhost:5000`

## Recommended Deployment Flow

1. Install root dependencies with `npm install`.
2. Install frontend dependencies through the build step with `npm run build`.
3. Start the backend with `npm start`.
4. Confirm the backend can reach MongoDB before opening the frontend route.

## What The Build Does

- Runs `npm --prefix client install`
- Runs `npm --prefix client run build`
- Produces the static frontend in `client/dist`
- Lets Express serve the built frontend and API from one process

## Pre-Deploy Checklist

- Root `package.json` scripts are the ones your platform uses.
- `server/.env` contains a valid `MONGO_URI`.
- `client/dist` is generated during the deploy build.
- `client/src/api.js` still points to `/api/workspaces` unless you intentionally split frontend and backend hosting.
- MongoDB network access is open to the deployment environment.

## Notes For Teams

- Treat `docs/PROJECT-STRUCTURE.md` as the codebase map for onboarding.
- Keep UI design work inside `client/src/components`, `client/src/pages`, and `client/src/index.css`.
- Keep business logic in `client/src/context`, `client/src/hooks`, and `server/`.
- Do not treat `client/src/App.backup.jsx`, `client/src/App.css`, `client/src/main.js`, or `server/notes.json` as active runtime files without an explicit decision to restore them.

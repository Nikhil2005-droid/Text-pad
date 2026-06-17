# Text Pad

Text Pad is a workspace-based notes and code pad with a React/Vite frontend and an Express/MongoDB backend. The root of this repository is the deployment source of truth: it builds the client, starts the API, and serves the built frontend from the backend.

## Runtime Layout

- `client/`: React application, UI system, routes, state, and editor experience.
- `server/`: Express API, MongoDB connection, workspace model, security helpers, and static hosting for the built client.
- `docs/`: Project structure and deployment handoff docs.

## Root Scripts

- `npm run client:dev`: start the Vite frontend in development.
- `npm run client:build`: build the frontend bundle.
- `npm run client:lint`: run frontend linting.
- `npm run build`: install client deps and produce the deployable frontend build.
- `npm start`: start the Express backend from `server/server.js`.

## Environment

- Backend env example: `server/.env.example`
- Frontend env example: `client/.env.example`

## Deployment Model

1. Install root dependencies with `npm install`.
2. Build the client with `npm run build`.
3. Start the backend with `npm start`.
4. The backend serves `client/dist` when it exists.

Read `docs/PROJECT-STRUCTURE.md` for the file map and `docs/DEPLOYMENT.md` for the deployment checklist.

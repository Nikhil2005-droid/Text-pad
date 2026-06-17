# Text Pad Backend

This folder contains the Express and MongoDB backend used by Text Pad.

## Active Runtime Files

- `server.js`: Express entry point and static client host
- `db.js`: MongoDB connection
- `models/Workspace.js`: workspace schema and embedded note/code data
- `routes/workspaceRoutes.js`: workspace, note, and code endpoints
- `utils/workspaceSecurity.js`: workspace password and token utilities
- `utils/rateLimit.js`: dependency-free in-memory API rate limiter

## Security Controls

- `CORS_ORIGIN`: optional comma-separated list of allowed browser origins. Empty allows same-origin/dev requests.
- `JSON_BODY_LIMIT`: Express JSON body limit, defaults to `1mb`.
- `API_RATE_LIMIT_WINDOW_MS`: API rate-limit window, defaults to `60000`.
- `API_RATE_LIMIT_MAX`: max API requests per IP per window, defaults to `240`.
- `WORKSPACE_TOKEN_TTL_MS`: password workspace token lifetime, defaults to 12 hours.

## Important Note

The repository deploys from the root. Use the root `package.json` for build/start commands and `server/.env.example` for backend environment setup.

# Technical Requirements Document

## System Overview

Text Pad is deployed as a single Node web service. The Express backend serves API routes and, in production, serves the React/Vite build from `client/dist`.

## Tech Stack

### Frontend

- React 19
- React Router 6
- Vite/Rolldown Vite
- Tailwind CSS utilities through `index.css`
- Native browser APIs:
  - `localStorage`
  - `BroadcastChannel`
  - `contentEditable`
  - Selection and Range APIs
  - Canvas for ruled paper lines

### Backend

- Node.js 20+
- Express 5
- Mongoose 9
- MongoDB / MongoDB Atlas
- dotenv
- cors
- Node crypto module for password hashing and tokens
- Optional Google Cloud Translation Advanced API for transliteration

### Testing

- Node built-in test runner for utility tests.
- ESLint for frontend linting.
- Vite build for frontend production verification.

## Runtime Architecture

```txt
Browser
  |
  | React app
  | /api/workspaces
  | /api/transliteration
  v
Express server
  |
  | Mongoose
  v
MongoDB
```

## Production Build

The root package is the deployment source of truth.

```bash
npm run build
npm start
```

Build command:

```bash
npm run client:install && npm run client:build
```

Start command:

```bash
node server/server.js
```

## Environment Variables

### Required

- `MONGO_URI`: MongoDB connection string.

### Recommended

- `NODE_ENV=production`
- `PORT`: server port. Defaults to `5000`.
- `CORS_ORIGIN`: comma-separated list of allowed origins. Empty allows same-origin/dev usage.
- `JSON_BODY_LIMIT`: Express JSON body limit. Defaults to `1mb`.
- `API_RATE_LIMIT_WINDOW_MS`: API rate-limit window. Defaults to `60000`.
- `API_RATE_LIMIT_MAX`: max API requests per IP per window. Defaults to `240`.
- `WORKSPACE_TOKEN_TTL_MS`: protected workspace token lifetime. Defaults to 12 hours.

### Optional Transliteration

- `GOOGLE_TRANSLITERATION_ENABLED`
- `GOOGLE_TRANSLITERATION_PROJECT_ID`
- `GOOGLE_TRANSLITERATION_LOCATION`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_TRANSLITERATION_CREDENTIALS_JSON`

## Frontend Routes

- `/`: Workspace page or workspace gate.
- `/workspace`: Alias for workspace page.
- `/docs`: In-product documentation.
- `/settings`: Workspace settings.
- `*`: Redirects to `/`.

## API Base URLs

Frontend defaults:

- Workspaces: `/api/workspaces`
- Transliteration: `/api/transliteration`

Optional client env overrides:

- `VITE_API_URL`
- `VITE_TRANSLITERATION_API_URL`
- `VITE_DEV_API_TARGET`

## Workspace API

### `POST /api/workspaces/open`

Opens an existing workspace or creates a new workspace.

Request:

```json
{
  "workspaceId": "my-workspace",
  "password": "optional"
}
```

Responses:

- `200`: sanitized workspace.
- `401`: password required or incorrect.
- `400`: invalid workspace ID.
- `500`: server error.

Protected response includes `accessToken`.

### `GET /api/workspaces/:workspaceId`

Returns sanitized workspace data.

Headers:

- `x-workspace-token`: required for password-protected workspaces.

### `PATCH /api/workspaces/:workspaceId`

Updates workspace identity, preferences, and security.

Body can include:

```json
{
  "workspaceName": "Project Name",
  "nextWorkspaceId": "project-id",
  "preferences": {
    "autoReplace": true,
    "ruledNotes": true,
    "confirmDeletes": true,
    "showAutosaveToasts": false,
    "noteLanguage": "english",
    "noteFontStyle": "literary",
    "noteColor": "#fff8ee",
    "codeFontStyle": "studio"
  },
  "security": {
    "currentPassword": "old",
    "nextPassword": "new",
    "removePassword": false
  }
}
```

### `DELETE /api/workspaces/:workspaceId`

Deletes a workspace and revokes in-memory tokens.

## Note API

### `POST /api/workspaces/:workspaceId/notes`

Creates a note.

Fields:

- `title`
- `content`
- `contentHtml`
- `noteLanguage`
- `noteFontStyle`
- `noteColor`
- `noteTextSize`
- `noteRuledLines`

### `PATCH /api/workspaces/:workspaceId/notes/:noteId`

Updates a note with revision conflict detection.

Required:

- `revision`

Optional:

- `title`
- `content`
- `contentHtml`
- note appearance fields

Conflict response:

```json
{
  "message": "Note changed in another tab",
  "conflict": true,
  "note": {}
}
```

### `DELETE /api/workspaces/:workspaceId/notes/:noteId`

Deletes one note.

## Code API

### `POST /api/workspaces/:workspaceId/codes`

Creates a code entry.

Fields:

- `title`
- `code`

### `PATCH /api/workspaces/:workspaceId/codes/:codeId`

Updates a code entry with revision conflict detection.

Required:

- `revision`

Optional:

- `title`
- `code`

### `DELETE /api/workspaces/:workspaceId/codes/:codeId`

Deletes one code entry.

## Transliteration API

### `GET /api/transliteration/status`

Returns Google transliteration configuration status.

### `POST /api/transliteration`

Request:

```json
{
  "text": "namaste",
  "language": "hindi"
}
```

Response:

```json
{
  "transliteratedText": "...",
  "languageCode": "hi",
  "provider": "google-cloud-translation-advanced"
}
```

## Security Requirements

- Do not return `passwordHash` or `passwordSalt`.
- Use `crypto.scryptSync` for password hashing.
- Use timing-safe password comparison.
- Use temporary in-memory workspace tokens for protected sessions.
- Expire workspace access tokens.
- Apply security headers:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
- Apply JSON body limit.
- Apply API rate limit.
- Keep destructive actions behind confirmation when enabled.

## Verification Commands

```bash
npm run client:test
npm run client:lint
npm run client:build
node --check server/server.js
```

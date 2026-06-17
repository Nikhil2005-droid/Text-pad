# Database Schema

## Database

MongoDB

## ODM

Mongoose

## Main Collection

`workspaces`

Text Pad stores each workspace as one MongoDB document. Notes and code entries are embedded arrays inside the workspace document.

## Workspace Document

```js
{
  _id: ObjectId,
  workspaceId: String,
  workspaceName: String,
  preferences: Preferences,
  security: Security,
  notes: Note[],
  codes: Code[],
  createdAt: Date,
  updatedAt: Date
}
```

### Fields

#### `workspaceId`

- Type: `String`
- Required: true
- Unique: true
- Indexed: true
- Purpose: user-facing stable workspace key.
- Validation: at least 3 characters at route level.

#### `workspaceName`

- Type: `String`
- Default: empty string.
- Purpose: display name in navbar/sidebar.

#### `preferences`

Embedded object. No `_id`.

#### `security`

Embedded object. No `_id`.

#### `notes`

Embedded note documents.

#### `codes`

Embedded code documents.

## Preferences Schema

```js
{
  autoReplace: Boolean,
  ruledNotes: Boolean,
  confirmDeletes: Boolean,
  showAutosaveToasts: Boolean,
  noteLanguage: String,
  noteFontStyle: String,
  noteColor: String,
  codeFontStyle: String
}
```

### Defaults

- `autoReplace`: true
- `ruledNotes`: true
- `confirmDeletes`: true
- `showAutosaveToasts`: false
- `noteLanguage`: `english`
- `noteFontStyle`: `literary`
- `noteColor`: `#fff8ee`
- `codeFontStyle`: `studio`

### Enums

`noteLanguage`:

- `english`
- `telugu`
- `hindi`
- `tamil`
- `malayalam`

`noteFontStyle`:

- `literary`
- `editorial`
- `modern`

`codeFontStyle`:

- `studio`
- `technical`
- `clean`

## Security Schema

```js
{
  isPasswordProtected: Boolean,
  passwordHash: String,
  passwordSalt: String
}
```

### Defaults

- `isPasswordProtected`: false
- `passwordHash`: empty string
- `passwordSalt`: empty string

### Select Behavior

`passwordHash` and `passwordSalt` use `select: false`. Routes explicitly select them only when verifying or updating passwords.

### Password Authentication

1. User submits workspace ID and password.
2. Backend loads workspace with password hash and salt.
3. Backend hashes submitted password with stored salt using `crypto.scryptSync`.
4. Backend compares hashes using `crypto.timingSafeEqual`.
5. On success, backend creates a temporary workspace access token.
6. Token is returned to client.
7. Client sends token in `x-workspace-token` for protected workspace API calls.

### Access Tokens

Tokens are:

- random 32-byte hex strings
- stored in memory on the server
- mapped to workspace ID and expiry timestamp
- expired by `WORKSPACE_TOKEN_TTL_MS`
- revoked when workspace password is removed or workspace is deleted

Important limitation: in-memory tokens do not survive server restarts and do not work across multiple server instances unless sticky sessions or shared storage are added.

## Note Schema

```js
{
  _id: ObjectId,
  title: String,
  content: String,
  contentHtml: String,
  revision: Number,
  noteLanguage: String,
  noteFontStyle: String,
  noteColor: String,
  noteTextSize: String,
  noteRuledLines: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Defaults

- `title`: `Untitled`
- `content`: empty string
- `contentHtml`: empty string
- `revision`: 0
- `noteLanguage`: `english`
- `noteFontStyle`: `literary`
- `noteColor`: `#fff8ee`
- `noteTextSize`: `comfortable`
- `noteRuledLines`: true

### Enums

`noteLanguage`:

- `english`
- `telugu`
- `hindi`
- `tamil`
- `malayalam`

`noteFontStyle`:

- `literary`
- `editorial`
- `modern`

`noteTextSize`:

- `compact`
- `comfortable`
- `large`
- `grand`

### Revision Handling

Each update requires a `revision`.

- If client revision matches stored revision, update succeeds.
- Backend increments revision by 1.
- If revision does not match, backend returns `409 Conflict` with latest note.

## Code Schema

```js
{
  _id: ObjectId,
  title: String,
  code: String,
  revision: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Defaults

- `title`: `Untitled`
- `code`: empty string
- `revision`: 0

### Revision Handling

Same as notes:

- client sends expected revision
- backend updates only matching revision
- backend returns conflict if another tab changed it first

## Relationships

Text Pad currently uses embedded relationships:

```txt
Workspace
  has many Notes
  has many Code entries
  has one Preferences object
  has one Security object
```

There is no separate user collection. Authentication is workspace-password based rather than account based.

## Sanitized Workspace Response

Before returning workspace data:

- remove `security`
- remove `passwordHash`
- remove `passwordSalt`
- add `isPasswordProtected`
- normalize note/code `revision`
- optionally include `accessToken`

Example:

```json
{
  "_id": "...",
  "workspaceId": "project",
  "workspaceName": "Project",
  "preferences": {},
  "notes": [],
  "codes": [],
  "isPasswordProtected": true,
  "accessToken": "optional"
}
```

## Future Database Improvements

- Move notes and codes into separate collections if workspace documents grow too large.
- Add indexes for note/code updated dates if separated.
- Add persistent token/session collection if multi-instance deployment is needed.
- Add audit log collection for destructive workspace actions.
- Add optional account/user collection if email login is introduced.

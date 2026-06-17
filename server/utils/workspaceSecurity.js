const crypto = require("crypto");

const workspaceAccessTokens = new Map();
const DEFAULT_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function getWorkspaceTokenTtlMs() {
  const configured = Number(process.env.WORKSPACE_TOKEN_TTL_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_TOKEN_TTL_MS;
}

function pruneExpiredWorkspaceAccessTokens(now = Date.now()) {
  for (const [accessToken, tokenData] of workspaceAccessTokens.entries()) {
    if (tokenData.expiresAt <= now) {
      workspaceAccessTokens.delete(accessToken);
    }
  }
}

function createWorkspacePasswordHash(password) {
  const passwordSalt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto
    .scryptSync(password, passwordSalt, 64)
    .toString("hex");

  return { passwordHash, passwordSalt };
}

function verifyWorkspacePassword(password, passwordHash, passwordSalt) {
  if (
    typeof password !== "string" ||
    typeof passwordHash !== "string" ||
    typeof passwordSalt !== "string" ||
    passwordHash.length === 0 ||
    passwordSalt.length === 0
  ) {
    return false;
  }

  const expectedHash = Buffer.from(passwordHash, "hex");
  const providedHash = crypto.scryptSync(password, passwordSalt, 64);

  if (expectedHash.length !== providedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHash, providedHash);
}

function createWorkspaceAccessToken(workspaceId) {
  const accessToken = crypto.randomBytes(32).toString("hex");
  workspaceAccessTokens.set(accessToken, {
    workspaceId,
    expiresAt: Date.now() + getWorkspaceTokenTtlMs(),
  });
  return accessToken;
}

function getWorkspaceAccessToken(req) {
  return req.get("x-workspace-token")?.trim() || "";
}

function hasWorkspaceAccessToken(workspaceId, accessToken) {
  if (!workspaceId || !accessToken) return false;
  pruneExpiredWorkspaceAccessTokens();

  const tokenData = workspaceAccessTokens.get(accessToken);
  return tokenData?.workspaceId === workspaceId;
}

function reassignWorkspaceAccessTokens(previousWorkspaceId, nextWorkspaceId) {
  if (!previousWorkspaceId || !nextWorkspaceId) return;
  pruneExpiredWorkspaceAccessTokens();

  for (const [accessToken, tokenData] of workspaceAccessTokens.entries()) {
    if (tokenData.workspaceId === previousWorkspaceId) {
      workspaceAccessTokens.set(accessToken, {
        ...tokenData,
        workspaceId: nextWorkspaceId,
      });
    }
  }
}

function revokeWorkspaceAccessTokens(workspaceId) {
  if (!workspaceId) return;

  for (const [accessToken, tokenData] of workspaceAccessTokens.entries()) {
    if (tokenData.workspaceId === workspaceId) {
      workspaceAccessTokens.delete(accessToken);
    }
  }
}

function sanitizeWorkspace(workspace, extras = {}) {
  const data =
    typeof workspace?.toObject === "function"
      ? workspace.toObject()
      : { ...(workspace || {}) };

  const isPasswordProtected = Boolean(data.security?.isPasswordProtected);

  if (data.security) {
    delete data.security.passwordHash;
    delete data.security.passwordSalt;
    delete data.security;
  }

  data.isPasswordProtected = isPasswordProtected;
  data.notes = Array.isArray(data.notes)
    ? data.notes.map((note) => ({
        ...note,
        revision: Number.isInteger(note?.revision) ? note.revision : 0,
      }))
    : [];
  data.codes = Array.isArray(data.codes)
    ? data.codes.map((code) => ({
        ...code,
        revision: Number.isInteger(code?.revision) ? code.revision : 0,
      }))
    : [];

  if (Object.prototype.hasOwnProperty.call(extras, "accessToken")) {
    data.accessToken = extras.accessToken;
  }

  return data;
}

module.exports = {
  createWorkspaceAccessToken,
  createWorkspacePasswordHash,
  getWorkspaceAccessToken,
  hasWorkspaceAccessToken,
  reassignWorkspaceAccessTokens,
  revokeWorkspaceAccessTokens,
  sanitizeWorkspace,
  verifyWorkspacePassword,
};

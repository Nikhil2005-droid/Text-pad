const crypto = require("crypto");

const workspaceAccessTokens = new Map();

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
  workspaceAccessTokens.set(accessToken, workspaceId);
  return accessToken;
}

function getWorkspaceAccessToken(req) {
  return req.get("x-workspace-token")?.trim() || "";
}

function hasWorkspaceAccessToken(workspaceId, accessToken) {
  if (!workspaceId || !accessToken) return false;
  return workspaceAccessTokens.get(accessToken) === workspaceId;
}

function reassignWorkspaceAccessTokens(previousWorkspaceId, nextWorkspaceId) {
  if (!previousWorkspaceId || !nextWorkspaceId) return;

  for (const [accessToken, workspaceId] of workspaceAccessTokens.entries()) {
    if (workspaceId === previousWorkspaceId) {
      workspaceAccessTokens.set(accessToken, nextWorkspaceId);
    }
  }
}

function revokeWorkspaceAccessTokens(workspaceId) {
  if (!workspaceId) return;

  for (const [accessToken, storedWorkspaceId] of workspaceAccessTokens.entries()) {
    if (storedWorkspaceId === workspaceId) {
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

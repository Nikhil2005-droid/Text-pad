const express = require("express");
const router = express.Router();
const Workspace = require("../models/Workspace");
const {
  createWorkspaceAccessToken,
  createWorkspacePasswordHash,
  getWorkspaceAccessToken,
  hasWorkspaceAccessToken,
  reassignWorkspaceAccessTokens,
  revokeWorkspaceAccessTokens,
  sanitizeWorkspace,
  verifyWorkspacePassword,
} = require("../utils/workspaceSecurity");

function normalizeWorkspaceId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveRequestedWorkspaceId(nextWorkspaceId, workspaceId) {
  if (typeof nextWorkspaceId === "string") return nextWorkspaceId;
  if (typeof workspaceId === "string") return workspaceId;
  return null;
}

function getWorkspaceResponseAccessToken(workspaceId, existingAccessToken) {
  if (
    existingAccessToken &&
    hasWorkspaceAccessToken(workspaceId, existingAccessToken)
  ) {
    return existingAccessToken;
  }

  return createWorkspaceAccessToken(workspaceId);
}

async function requireWorkspaceAccess(req, res, next) {
  try {
    const workspace = await Workspace.findOne({
      workspaceId: req.params.workspaceId,
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    req.workspace = workspace;

    if (!workspace.security?.isPasswordProtected) {
      req.workspaceAccessToken = null;
      return next();
    }

    const accessToken = getWorkspaceAccessToken(req);
    if (!hasWorkspaceAccessToken(workspace.workspaceId, accessToken)) {
      return res.status(401).json({
        message: "Workspace password required",
        requiresPassword: true,
      });
    }

    req.workspaceAccessToken = accessToken;
    next();
  } catch (err) {
    console.error("Workspace access error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * OPEN or CREATE a workspace
 * POST /api/workspaces/open
 */
router.post("/open", async (req, res) => {
  try {
    const { workspaceId, password } = req.body ?? {};
    const workspaceIdTrimmed = normalizeWorkspaceId(workspaceId);

    if (!workspaceIdTrimmed) {
      return res.status(400).json({ message: "workspaceId is required" });
    }
    if (workspaceIdTrimmed.length < 3) {
      return res
        .status(400)
        .json({ message: "workspaceId must be at least 3 characters" });
    }

    let workspace = await Workspace.findOne({
      workspaceId: workspaceIdTrimmed,
    }).select("+security.passwordHash +security.passwordSalt");

    if (!workspace) {
      workspace = await Workspace.create({
        workspaceId: workspaceIdTrimmed,
        workspaceName: workspaceIdTrimmed,
        notes: [],
        codes: [],
      });

      return res.json(sanitizeWorkspace(workspace));
    }

    if (!workspace.workspaceName) {
      workspace.workspaceName = workspace.workspaceId;
      await workspace.save();
    }

    if (workspace.security?.isPasswordProtected) {
      if (typeof password !== "string" || password.length === 0) {
        return res.status(401).json({
          message: "Workspace password required",
          requiresPassword: true,
        });
      }

      const isPasswordValid = verifyWorkspacePassword(
        password,
        workspace.security?.passwordHash,
        workspace.security?.passwordSalt
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Incorrect workspace password",
          requiresPassword: true,
        });
      }

      const accessToken = createWorkspaceAccessToken(workspace.workspaceId);
      return res.json(sanitizeWorkspace(workspace, { accessToken }));
    }

    res.json(sanitizeWorkspace(workspace));
  } catch (err) {
    console.error("Open workspace error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.use("/:workspaceId", requireWorkspaceAccess);

/**
 * GET workspace with notes
 * GET /api/workspaces/:workspaceId
 */
router.get("/:workspaceId", async (req, res) => {
  res.json(sanitizeWorkspace(req.workspace));
});

/**
 * UPDATE workspace settings (e.g., name, preferences, password protection)
 * PATCH /api/workspaces/:workspaceId
 */
router.patch("/:workspaceId", async (req, res) => {
  try {
    const { workspaceName, nextWorkspaceId, workspaceId, preferences, security } =
      req.body ?? {};
    const requestedNextId = resolveRequestedWorkspaceId(
      nextWorkspaceId,
      workspaceId
    );
    const previousWorkspaceId = req.params.workspaceId;

    const workspace = await Workspace.findOne({
      workspaceId: previousWorkspaceId,
    }).select("+security.passwordHash +security.passwordSalt");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (typeof workspaceName === "string") {
      workspace.workspaceName = workspaceName;
    }

    if (requestedNextId !== null) {
      const trimmedWorkspaceId = normalizeWorkspaceId(requestedNextId);
      if (trimmedWorkspaceId.length < 3) {
        return res
          .status(400)
          .json({ message: "workspaceId must be at least 3 characters" });
      }

      workspace.workspaceId = trimmedWorkspaceId;
      if (typeof workspaceName !== "string") {
        workspace.workspaceName = trimmedWorkspaceId;
      }
    }

    if (preferences && typeof preferences === "object") {
      const allowedPreferences = [
        "autoReplace",
        "ruledNotes",
        "confirmDeletes",
        "showAutosaveToasts",
      ];

      for (const key of allowedPreferences) {
        if (typeof preferences[key] === "boolean") {
          workspace.preferences[key] = preferences[key];
        }
      }
    }

    if (security && typeof security === "object") {
      const { currentPassword, nextPassword, removePassword } = security;
      const isProtected = Boolean(workspace.security?.isPasswordProtected);

      if (removePassword) {
        if (
          isProtected &&
          !verifyWorkspacePassword(
            currentPassword,
            workspace.security?.passwordHash,
            workspace.security?.passwordSalt
          )
        ) {
          return res.status(401).json({
            message: "Current workspace password is incorrect",
          });
        }

        workspace.security = {
          isPasswordProtected: false,
          passwordHash: "",
          passwordSalt: "",
        };
        revokeWorkspaceAccessTokens(previousWorkspaceId);
      } else if (typeof nextPassword === "string") {
        if (nextPassword.length < 4) {
          return res.status(400).json({
            message: "Workspace password must be at least 4 characters",
          });
        }

        if (
          isProtected &&
          !verifyWorkspacePassword(
            currentPassword,
            workspace.security?.passwordHash,
            workspace.security?.passwordSalt
          )
        ) {
          return res.status(401).json({
            message: "Current workspace password is incorrect",
          });
        }

        const { passwordHash, passwordSalt } =
          createWorkspacePasswordHash(nextPassword);
        workspace.security = {
          isPasswordProtected: true,
          passwordHash,
          passwordSalt,
        };
      }
    }

    await workspace.save();

    if (previousWorkspaceId !== workspace.workspaceId) {
      reassignWorkspaceAccessTokens(previousWorkspaceId, workspace.workspaceId);
    }

    const responseExtras = {};
    if (workspace.security?.isPasswordProtected) {
      responseExtras.accessToken = getWorkspaceResponseAccessToken(
        workspace.workspaceId,
        req.workspaceAccessToken
      );
    } else if (req.workspaceAccessToken) {
      responseExtras.accessToken = null;
    }

    res.json(sanitizeWorkspace(workspace, responseExtras));
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "workspaceId already exists" });
    }
    console.error("Update workspace error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ADD a note to workspace
 * POST /api/workspaces/:workspaceId/notes
 */
router.post("/:workspaceId/notes", async (req, res) => {
  try {
    const { title, content } = req.body;

    const workspace = await Workspace.findOneAndUpdate(
      { workspaceId: req.params.workspaceId },
      {
        $push: {
          notes: {
            title,
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace.notes);
  } catch (err) {
    console.error("Add note error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ADD a code entry to workspace
 * POST /api/workspaces/:workspaceId/codes
 */
router.post("/:workspaceId/codes", async (req, res) => {
  try {
    const { title, code } = req.body;

    const workspace = await Workspace.findOneAndUpdate(
      { workspaceId: req.params.workspaceId },
      {
        $push: {
          codes: {
            title,
            code,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace.codes);
  } catch (err) {
    console.error("Add code error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE ONE code entry inside codes array
 * PUT /api/workspaces/:workspaceId/codes/:codeId
 */
router.put("/:workspaceId/codes/:codeId", async (req, res) => {
  try {
    const { title, code } = req.body;

    const workspace = await Workspace.findOneAndUpdate(
      {
        workspaceId: req.params.workspaceId,
        "codes._id": req.params.codeId,
      },
      {
        $set: {
          "codes.$.title": title,
          "codes.$.code": code,
          "codes.$.updatedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Code or workspace not found" });
    }

    res.json(workspace.codes);
  } catch (err) {
    console.error("Update code error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE ONE code entry
 * DELETE /api/workspaces/:workspaceId/codes/:codeId
 */
router.delete("/:workspaceId/codes/:codeId", async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndUpdate(
      { workspaceId: req.params.workspaceId },
      {
        $pull: {
          codes: { _id: req.params.codeId },
        },
      },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace.codes);
  } catch (err) {
    console.error("Delete code error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE ONE note inside notes array
 * PUT /api/workspaces/:workspaceId/notes/:noteId
 */
router.put("/:workspaceId/notes/:noteId", async (req, res) => {
  try {
    const { title, content } = req.body;

    const workspace = await Workspace.findOneAndUpdate(
      {
        workspaceId: req.params.workspaceId,
        "notes._id": req.params.noteId,
      },
      {
        $set: {
          "notes.$.title": title,
          "notes.$.content": content,
          "notes.$.updatedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Note or workspace not found" });
    }

    res.json(workspace.notes);
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE ONE note
 * DELETE /api/workspaces/:workspaceId/notes/:noteId
 */
router.delete("/:workspaceId/notes/:noteId", async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndUpdate(
      { workspaceId: req.params.workspaceId },
      {
        $pull: {
          notes: { _id: req.params.noteId },
        },
      },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace.notes);
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE workspace
 * DELETE /api/workspaces/:workspaceId
 */
router.delete("/:workspaceId", async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndDelete({
      workspaceId: req.params.workspaceId,
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    revokeWorkspaceAccessTokens(req.params.workspaceId);
    res.json({ message: "Workspace deleted successfully" });
  } catch (err) {
    console.error("Delete workspace error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

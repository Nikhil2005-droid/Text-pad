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

const NOTE_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;
const NOTE_LANGUAGE_VALUES = [
  "english",
  "telugu",
  "hindi",
  "tamil",
  "malayalam",
];
const NOTE_FONT_STYLE_VALUES = ["literary", "editorial", "modern"];
const NOTE_TEXT_SIZE_VALUES = ["compact", "comfortable", "large", "grand"];
const DEFAULT_NOTE_APPEARANCE = {
  noteLanguage: "english",
  noteFontStyle: "literary",
  noteColor: "#fff8ee",
  noteTextSize: "comfortable",
  noteRuledLines: true,
};

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

function normalizeNoteAppearance(input = {}) {
  const normalized = {};

  if (
    typeof input.noteLanguage === "string" &&
    NOTE_LANGUAGE_VALUES.includes(input.noteLanguage)
  ) {
    normalized.noteLanguage = input.noteLanguage;
  }

  if (
    typeof input.noteFontStyle === "string" &&
    NOTE_FONT_STYLE_VALUES.includes(input.noteFontStyle)
  ) {
    normalized.noteFontStyle = input.noteFontStyle;
  }

  if (
    typeof input.noteColor === "string" &&
    NOTE_COLOR_REGEX.test(input.noteColor.trim())
  ) {
    normalized.noteColor = input.noteColor.trim().toLowerCase();
  }

  if (
    typeof input.noteTextSize === "string" &&
    NOTE_TEXT_SIZE_VALUES.includes(input.noteTextSize)
  ) {
    normalized.noteTextSize = input.noteTextSize;
  }

  if (typeof input.noteRuledLines === "boolean") {
    normalized.noteRuledLines = input.noteRuledLines;
  }

  return normalized;
}

function normalizeRevision(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function withNormalizedRevision(entry) {
  if (!entry) return null;
  const data =
    typeof entry.toObject === "function" ? entry.toObject() : { ...entry };

  return {
    ...data,
    revision: Number.isInteger(data?.revision) ? data.revision : 0,
  };
}

function buildRevisionMatch(id, revision) {
  if (revision === 0) {
    return {
      _id: id,
      $or: [{ revision: 0 }, { revision: { $exists: false } }],
    };
  }

  return {
    _id: id,
    revision,
  };
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
      const booleanPreferences = [
        "autoReplace",
        "ruledNotes",
        "confirmDeletes",
        "showAutosaveToasts",
      ];
      const enumPreferences = {
        noteLanguage: NOTE_LANGUAGE_VALUES,
        noteFontStyle: NOTE_FONT_STYLE_VALUES,
        codeFontStyle: ["studio", "technical", "clean"],
      };

      for (const key of booleanPreferences) {
        if (typeof preferences[key] === "boolean") {
          workspace.preferences[key] = preferences[key];
        }
      }

      for (const [key, allowedValues] of Object.entries(enumPreferences)) {
        if (
          typeof preferences[key] === "string" &&
          allowedValues.includes(preferences[key])
        ) {
          workspace.preferences[key] = preferences[key];
        }
      }

      if (
        typeof preferences.noteColor === "string" &&
        NOTE_COLOR_REGEX.test(preferences.noteColor.trim())
      ) {
        workspace.preferences.noteColor = preferences.noteColor.trim().toLowerCase();
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
    const { title, content, contentHtml } = req.body ?? {};
    const noteAppearance = normalizeNoteAppearance(req.body ?? {});

    const workspace = await Workspace.findOneAndUpdate(
      { workspaceId: req.params.workspaceId },
      {
        $push: {
          notes: {
            title,
            content,
            contentHtml,
            noteLanguage:
              noteAppearance.noteLanguage ?? DEFAULT_NOTE_APPEARANCE.noteLanguage,
            noteFontStyle:
              noteAppearance.noteFontStyle ??
              DEFAULT_NOTE_APPEARANCE.noteFontStyle,
            noteColor:
              noteAppearance.noteColor ?? DEFAULT_NOTE_APPEARANCE.noteColor,
            noteTextSize:
              noteAppearance.noteTextSize ?? DEFAULT_NOTE_APPEARANCE.noteTextSize,
            noteRuledLines:
              noteAppearance.noteRuledLines ??
              DEFAULT_NOTE_APPEARANCE.noteRuledLines,
            revision: 0,
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

    const createdNote = workspace.notes[workspace.notes.length - 1];
    res.status(201).json({ note: withNormalizedRevision(createdNote) });
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
    const { title, code } = req.body ?? {};

    const workspace = await Workspace.findOneAndUpdate(
      { workspaceId: req.params.workspaceId },
      {
        $push: {
          codes: {
            title,
            code,
            revision: 0,
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

    const createdCode = workspace.codes[workspace.codes.length - 1];
    res.status(201).json({ code: withNormalizedRevision(createdCode) });
  } catch (err) {
    console.error("Add code error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE ONE code entry inside codes array
 * PATCH /api/workspaces/:workspaceId/codes/:codeId
 */
async function updateCodeEntry(req, res) {
  try {
    const { title, code, revision } = req.body ?? {};
    const expectedRevision = normalizeRevision(revision);

    if (expectedRevision === null) {
      return res.status(400).json({ message: "revision is required" });
    }

    const nextSet = {
      "codes.$.updatedAt": new Date(),
      "codes.$.revision": expectedRevision + 1,
    };

    if (typeof title === "string") {
      nextSet["codes.$.title"] = title;
    }

    if (typeof code === "string") {
      nextSet["codes.$.code"] = code;
    }

    const workspace = await Workspace.findOneAndUpdate(
      {
        workspaceId: req.params.workspaceId,
        codes: {
          $elemMatch: buildRevisionMatch(req.params.codeId, expectedRevision),
        },
      },
      {
        $set: nextSet,
      },
      { new: true }
    );

    if (!workspace) {
      const currentWorkspace = await Workspace.findOne(
        {
          workspaceId: req.params.workspaceId,
          "codes._id": req.params.codeId,
        },
        { "codes.$": 1 }
      );

      if (!currentWorkspace?.codes?.length) {
        return res.status(404).json({ message: "Code or workspace not found" });
      }

      return res.status(409).json({
        message: "Code entry changed in another tab",
        conflict: true,
        code: withNormalizedRevision(currentWorkspace.codes[0]),
      });
    }

    res.json({
      code: withNormalizedRevision(workspace.codes.id(req.params.codeId)),
    });
  } catch (err) {
    console.error("Update code error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

router.patch("/:workspaceId/codes/:codeId", updateCodeEntry);
router.put("/:workspaceId/codes/:codeId", updateCodeEntry);

/**
 * DELETE ONE code entry
 * DELETE /api/workspaces/:workspaceId/codes/:codeId
 */
router.delete("/:workspaceId/codes/:codeId", async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndUpdate(
      {
        workspaceId: req.params.workspaceId,
        "codes._id": req.params.codeId,
      },
      {
        $pull: {
          codes: { _id: req.params.codeId },
        },
      },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Code or workspace not found" });
    }

    res.json({ deletedId: req.params.codeId });
  } catch (err) {
    console.error("Delete code error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE ONE note inside notes array
 * PATCH /api/workspaces/:workspaceId/notes/:noteId
 */
async function updateNoteEntry(req, res) {
  try {
    const { title, content, contentHtml, revision } = req.body ?? {};
    const noteAppearance = normalizeNoteAppearance(req.body ?? {});
    const expectedRevision = normalizeRevision(revision);

    if (expectedRevision === null) {
      return res.status(400).json({ message: "revision is required" });
    }

    const nextSet = {
      "notes.$.updatedAt": new Date(),
      "notes.$.revision": expectedRevision + 1,
    };

    if (typeof title === "string") {
      nextSet["notes.$.title"] = title;
    }

    if (typeof content === "string") {
      nextSet["notes.$.content"] = content;
    }

    if (typeof contentHtml === "string") {
      nextSet["notes.$.contentHtml"] = contentHtml;
    }

    if (typeof noteAppearance.noteLanguage === "string") {
      nextSet["notes.$.noteLanguage"] = noteAppearance.noteLanguage;
    }

    if (typeof noteAppearance.noteFontStyle === "string") {
      nextSet["notes.$.noteFontStyle"] = noteAppearance.noteFontStyle;
    }

    if (typeof noteAppearance.noteColor === "string") {
      nextSet["notes.$.noteColor"] = noteAppearance.noteColor;
    }

    if (typeof noteAppearance.noteTextSize === "string") {
      nextSet["notes.$.noteTextSize"] = noteAppearance.noteTextSize;
    }

    if (typeof noteAppearance.noteRuledLines === "boolean") {
      nextSet["notes.$.noteRuledLines"] = noteAppearance.noteRuledLines;
    }

    const workspace = await Workspace.findOneAndUpdate(
      {
        workspaceId: req.params.workspaceId,
        notes: {
          $elemMatch: buildRevisionMatch(req.params.noteId, expectedRevision),
        },
      },
      {
        $set: nextSet,
      },
      { new: true }
    );

    if (!workspace) {
      const currentWorkspace = await Workspace.findOne(
        {
          workspaceId: req.params.workspaceId,
          "notes._id": req.params.noteId,
        },
        { "notes.$": 1 }
      );

      if (!currentWorkspace?.notes?.length) {
        return res.status(404).json({ message: "Note or workspace not found" });
      }

      return res.status(409).json({
        message: "Note changed in another tab",
        conflict: true,
        note: withNormalizedRevision(currentWorkspace.notes[0]),
      });
    }

    res.json({
      note: withNormalizedRevision(workspace.notes.id(req.params.noteId)),
    });
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

router.patch("/:workspaceId/notes/:noteId", updateNoteEntry);
router.put("/:workspaceId/notes/:noteId", updateNoteEntry);

/**
 * DELETE ONE note
 * DELETE /api/workspaces/:workspaceId/notes/:noteId
 */
router.delete("/:workspaceId/notes/:noteId", async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndUpdate(
      {
        workspaceId: req.params.workspaceId,
        "notes._id": req.params.noteId,
      },
      {
        $pull: {
          notes: { _id: req.params.noteId },
        },
      },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Note or workspace not found" });
    }

    res.json({ deletedId: req.params.noteId });
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

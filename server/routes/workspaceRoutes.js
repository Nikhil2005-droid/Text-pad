const express = require("express");
const router = express.Router();
const Workspace = require("../models/Workspace");

/**
 * OPEN or CREATE a workspace
 * POST /api/workspaces/open
 */
router.post("/open", async (req, res) => {
  try {
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ message: "workspaceId is required" });
    }
    const workspaceIdTrimmed = workspaceId.trim();
    if (workspaceIdTrimmed.length < 3) {
      return res.status(400).json({ message: "workspaceId must be at least 3 characters" });
    }

    let workspace = await Workspace.findOne({ workspaceId: workspaceIdTrimmed });

    if (!workspace) {
      workspace = await Workspace.create({
        workspaceId: workspaceIdTrimmed,
        workspaceName: workspaceIdTrimmed,
        notes: [],
        codes: []
      });
    } else if (!workspace.workspaceName) {
      workspace.workspaceName = workspace.workspaceId;
      await workspace.save();
    }

    res.json(workspace);
  } catch (err) {
    console.error("Open workspace error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET workspace with notes
 * GET /api/workspaces/:workspaceId
 */
router.get("/:workspaceId", async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      workspaceId: req.params.workspaceId
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);
  } catch (err) {
    console.error("Fetch workspace error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE workspace settings (e.g., name)
 * PATCH /api/workspaces/:workspaceId
 */
router.patch("/:workspaceId", async (req, res) => {
  try {
    const { workspaceName, nextWorkspaceId, workspaceId, preferences } = req.body;
    const requestedNextId =
      typeof nextWorkspaceId === "string"
        ? nextWorkspaceId
        : typeof workspaceId === "string"
        ? workspaceId
        : null;

    const update = {};
    if (typeof workspaceName === "string") {
      update.workspaceName = workspaceName;
    }
    if (requestedNextId !== null) {
      const trimmed = requestedNextId.trim();
      if (trimmed.length < 3) {
        return res
          .status(400)
          .json({ message: "workspaceId must be at least 3 characters" });
      }
      update.workspaceId = trimmed;
      // If no explicit name is provided, keep display name in sync with id.
      if (typeof workspaceName !== "string") {
        update.workspaceName = trimmed;
      }
    }

    if (preferences && typeof preferences === "object") {
      const allowed = [
        "autoReplace",
        "ruledNotes",
        "confirmDeletes",
        "showAutosaveToasts",
      ];
      for (const key of allowed) {
        if (typeof preferences[key] === "boolean") {
          update[`preferences.${key}`] = preferences[key];
        }
      }
    }

    const workspace = await Workspace.findOneAndUpdate(
      { workspaceId: req.params.workspaceId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);
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
            updatedAt: new Date()
          }
        }
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
        "notes._id": req.params.noteId
      },
      {
        $set: {
          "notes.$.title": title,
          "notes.$.content": content,
          "notes.$.updatedAt": new Date()
        }
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
          notes: { _id: req.params.noteId }
        }
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
      workspaceId: req.params.workspaceId
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json({ message: "Workspace deleted successfully" });
  } catch (err) {
    console.error("Delete workspace error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

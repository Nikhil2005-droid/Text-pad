const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled",
    },
    content: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const codeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled",
    },
    code: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const preferencesSchema = new mongoose.Schema(
  {
    autoReplace: {
      type: Boolean,
      default: true,
    },
    ruledNotes: {
      type: Boolean,
      default: true,
    },
    confirmDeletes: {
      type: Boolean,
      default: true,
    },
    showAutosaveToasts: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    workspaceName: {
      type: String,
      default: "",
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
    notes: [noteSchema],
    codes: [codeSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);

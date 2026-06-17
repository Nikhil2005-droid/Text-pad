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
    contentHtml: {
      type: String,
      default: "",
    },
    revision: {
      type: Number,
      default: 0,
    },
    noteLanguage: {
      type: String,
      enum: ["english", "telugu", "hindi", "tamil", "malayalam"],
      default: "english",
    },
    noteFontStyle: {
      type: String,
      enum: ["literary", "editorial", "modern"],
      default: "literary",
    },
    noteColor: {
      type: String,
      default: "#fff8ee",
    },
    noteTextSize: {
      type: String,
      enum: ["compact", "comfortable", "large", "grand"],
      default: "comfortable",
    },
    noteRuledLines: {
      type: Boolean,
      default: true,
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
    revision: {
      type: Number,
      default: 0,
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
    noteLanguage: {
      type: String,
      enum: ["english", "telugu", "hindi", "tamil", "malayalam"],
      default: "english",
    },
    noteFontStyle: {
      type: String,
      enum: ["literary", "editorial", "modern"],
      default: "literary",
    },
    noteColor: {
      type: String,
      default: "#fff8ee",
    },
    codeFontStyle: {
      type: String,
      enum: ["studio", "technical", "clean"],
      default: "studio",
    },
  },
  { _id: false }
);

const securitySchema = new mongoose.Schema(
  {
    isPasswordProtected: {
      type: Boolean,
      default: false,
    },
    passwordHash: {
      type: String,
      default: "",
      select: false,
    },
    passwordSalt: {
      type: String,
      default: "",
      select: false,
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
    security: {
      type: securitySchema,
      default: () => ({}),
    },
    notes: [noteSchema],
    codes: [codeSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);

const express = require("express");
const router = express.Router();
const {
  GOOGLE_TRANSLITERATION_SUPPORTED_LANGUAGES,
  getGoogleTransliterationStatus,
  supportsGoogleTransliteration,
  transliterateWithGoogle,
} = require("../utils/transliterationService");

const APP_LANGUAGE_TO_CODE = {
  telugu: "te",
  hindi: "hi",
  tamil: "ta",
  malayalam: "ml",
};

function resolveLanguageCode(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return APP_LANGUAGE_TO_CODE[normalized] || normalized || null;
}

router.get("/status", async (_req, res) => {
  try {
    const status = await getGoogleTransliterationStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      configured: false,
      provider: "google-cloud-translation-advanced",
      supportedLanguages: GOOGLE_TRANSLITERATION_SUPPORTED_LANGUAGES,
      message: error?.message || "Unable to read transliteration status",
    });
  }
});

router.post("/", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text : "";
  const languageCode = resolveLanguageCode(req.body?.language);

  if (!text.trim()) {
    return res.status(400).json({ message: "text is required" });
  }

  if (!languageCode) {
    return res.status(400).json({ message: "language is required" });
  }

  if (!supportsGoogleTransliteration(languageCode)) {
    return res.status(400).json({
      message:
        "Google transliteration is currently wired for Telugu, Hindi, and Tamil.",
      supportedLanguages: GOOGLE_TRANSLITERATION_SUPPORTED_LANGUAGES,
    });
  }

  try {
    const transliteratedText = await transliterateWithGoogle({
      text,
      languageCode,
    });

    res.json({
      transliteratedText,
      languageCode,
      provider: "google-cloud-translation-advanced",
    });
  } catch (error) {
    const statusCode =
      error?.code === "UNSUPPORTED_LANGUAGE"
        ? 400
        : error?.code === "FEATURE_DISABLED" || error?.code === "MISSING_PROJECT"
        ? 503
        : error?.status || 502;

    res.status(statusCode).json({
      message: error?.message || "Unable to transliterate text",
      code: error?.code || "TRANSLITERATION_FAILED",
      configured:
        error?.code !== "FEATURE_DISABLED" && error?.code !== "MISSING_PROJECT",
      supportedLanguages: GOOGLE_TRANSLITERATION_SUPPORTED_LANGUAGES,
    });
  }
});

module.exports = router;

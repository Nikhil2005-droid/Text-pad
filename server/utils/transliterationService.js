const GOOGLE_TRANSLITERATION_PROVIDER = "google-cloud-translation-advanced";
const GOOGLE_TRANSLITERATION_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform";
const GOOGLE_TRANSLITERATION_SUPPORTED_LANGUAGES = ["te", "hi", "ta"];

let googleAuthInstance = null;
let GoogleAuthClass = null;

function isFeatureDisabled() {
  return process.env.GOOGLE_TRANSLITERATION_ENABLED === "false";
}

function getInlineCredentials() {
  const raw = process.env.GOOGLE_TRANSLITERATION_CREDENTIALS_JSON;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("Invalid GOOGLE_TRANSLITERATION_CREDENTIALS_JSON");
  }
}

function hasGoogleRuntimeHints() {
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT ||
      process.env.K_SERVICE ||
      process.env.K_REVISION ||
      process.env.FUNCTION_TARGET ||
      process.env.FUNCTION_NAME ||
      process.env.GAE_ENV
  );
}

function hasGoogleTransliterationConfigHints() {
  return Boolean(
    getConfiguredProjectId() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_TRANSLITERATION_CREDENTIALS_JSON ||
      hasGoogleRuntimeHints()
  );
}

function getGoogleAuthClass() {
  if (GoogleAuthClass) {
    return GoogleAuthClass;
  }

  ({ GoogleAuth: GoogleAuthClass } = require("google-auth-library"));
  return GoogleAuthClass;
}

function getGoogleAuth() {
  if (googleAuthInstance) {
    return googleAuthInstance;
  }

  const inlineCredentials = getInlineCredentials();
  const GoogleAuth = getGoogleAuthClass();
  googleAuthInstance = new GoogleAuth({
    credentials: inlineCredentials ?? undefined,
    scopes: [GOOGLE_TRANSLITERATION_SCOPE],
  });

  return googleAuthInstance;
}

function getConfiguredProjectId() {
  return (
    process.env.GOOGLE_TRANSLITERATION_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    ""
  ).trim();
}

function getConfiguredLocation() {
  return (process.env.GOOGLE_TRANSLITERATION_LOCATION || "global").trim();
}

function supportsGoogleTransliteration(languageCode) {
  return GOOGLE_TRANSLITERATION_SUPPORTED_LANGUAGES.includes(languageCode);
}

async function getResolvedProjectId(auth) {
  const explicitProjectId = getConfiguredProjectId();
  if (explicitProjectId) return explicitProjectId;

  const projectId = await auth.getProjectId();
  return typeof projectId === "string" ? projectId.trim() : "";
}

async function getGoogleTransliterationStatus() {
  const baseStatus = {
    provider: GOOGLE_TRANSLITERATION_PROVIDER,
    configured: false,
    supportedLanguages: GOOGLE_TRANSLITERATION_SUPPORTED_LANGUAGES,
    location: getConfiguredLocation(),
  };

  if (isFeatureDisabled()) {
    return {
      ...baseStatus,
      reason: "disabled",
    };
  }

  if (!hasGoogleTransliterationConfigHints()) {
    return {
      ...baseStatus,
      reason: "not_configured",
    };
  }

  try {
    const auth = getGoogleAuth();
    const projectId = await getResolvedProjectId(auth);
    if (!projectId) {
      return {
        ...baseStatus,
        reason: "missing_project",
      };
    }

    const client = await auth.getClient();
    await client.getRequestHeaders();

    return {
      ...baseStatus,
      configured: true,
      projectId,
    };
  } catch (error) {
    return {
      ...baseStatus,
      reason: "auth_error",
      message: error?.message || "Unable to initialize Google transliteration",
    };
  }
}

async function transliterateWithGoogle({ text, languageCode }) {
  const normalizedText = typeof text === "string" ? text.trim() : "";
  if (!normalizedText) {
    return "";
  }

  if (!supportsGoogleTransliteration(languageCode)) {
    const error = new Error("Language is not supported for Google transliteration");
    error.code = "UNSUPPORTED_LANGUAGE";
    throw error;
  }

  if (isFeatureDisabled()) {
    const error = new Error("Google transliteration is disabled");
    error.code = "FEATURE_DISABLED";
    throw error;
  }

  if (!hasGoogleTransliterationConfigHints()) {
    const error = new Error("Google transliteration is not configured");
    error.code = "MISSING_PROJECT";
    throw error;
  }

  const auth = getGoogleAuth();
  const projectId = await getResolvedProjectId(auth);
  if (!projectId) {
    const error = new Error("Google Cloud project ID is not configured");
    error.code = "MISSING_PROJECT";
    throw error;
  }

  const client = await auth.getClient();
  const headers = await client.getRequestHeaders();
  const location = getConfiguredLocation();
  const endpoint = `https://translation.googleapis.com/v3/projects/${encodeURIComponent(
    projectId
  )}/locations/${encodeURIComponent(location)}:translateText`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "x-goog-user-project": projectId,
    },
    body: JSON.stringify({
      contents: [normalizedText],
      mimeType: "text/plain",
      // The input is romanized text for the same destination language.
      sourceLanguageCode: languageCode,
      targetLanguageCode: languageCode,
      transliterationConfig: {
        enableTransliteration: true,
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || "Google transliteration request failed"
    );
    error.code = "GOOGLE_TRANSLITERATION_FAILED";
    error.status = response.status;
    throw error;
  }

  const transliteratedText = payload?.translations?.[0]?.translatedText;
  if (typeof transliteratedText !== "string") {
    const error = new Error("Google transliteration returned an invalid response");
    error.code = "INVALID_TRANSLITERATION_RESPONSE";
    throw error;
  }

  return transliteratedText;
}

module.exports = {
  GOOGLE_TRANSLITERATION_PROVIDER,
  GOOGLE_TRANSLITERATION_SUPPORTED_LANGUAGES,
  getGoogleTransliterationStatus,
  supportsGoogleTransliteration,
  transliterateWithGoogle,
};

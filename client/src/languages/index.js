import {
  TELUGU_DIGIT_MAP,
  TELUGU_PHYSICAL_HINTS,
  TELUGU_SCRIPT_KEYBOARD,
  transliterateRomanToTelugu,
} from "./telugu.js";
import {
  HINDI_DIGIT_MAP,
  HINDI_SCRIPT_KEYBOARD as HINDI_LOCAL_SCRIPT_KEYBOARD,
  transliterateRomanToHindi,
} from "./hindi.js";
import {
  MALAYALAM_DIGIT_MAP,
  MALAYALAM_PHYSICAL_HINTS,
  MALAYALAM_SCRIPT_KEYBOARD,
  transliterateRomanToMalayalam,
} from "./malayalam.js";
import {
  TAMIL_DIGIT_MAP,
  TAMIL_SCRIPT_KEYBOARD as TAMIL_LOCAL_SCRIPT_KEYBOARD,
  transliterateRomanToTamil,
} from "./tamil.js";

export const DEFAULT_NOTE_LANGUAGE = "english";
export const DEFAULT_NOTE_FONT_STYLE = "literary";
export const DEFAULT_CODE_FONT_STYLE = "studio";
export const DEFAULT_NOTE_COLOR = "#fff8ee";

const NOTE_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

export const NOTE_LANGUAGE_OPTIONS = [
  {
    value: "english",
    label: "English",
    nativeLabel: "English",
    description: "Default Latin writing with the existing premium notebook feel.",
    badgeText: "Aa",
    className: "font-language-english",
    locale: "en",
    placeholder: "Start writing your note...",
    titlePlaceholder: "Note title",
    lineHeight: 1.85,
    fontSize: "1rem",
  },
  {
    value: "telugu",
    label: "Telugu",
    nativeLabel: "తెలుగు",
    description: "Rounded Telugu script with curated fonts and a tap-ready letter layout.",
    badgeText: "అఆ",
    className: "font-language-telugu",
    locale: "te",
    placeholder: "తెలుగులో రాయడం ప్రారంభించండి...",
    titlePlaceholder: "గమనిక శీర్షిక",
    lineHeight: 2.2,
    fontSize: "1.08rem",
  },
  {
    value: "hindi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    description: "Premium Devanagari note styles with a literary Hindi writing surface.",
    badgeText: "अआ",
    className: "font-language-hindi",
    locale: "hi",
    placeholder: "हिन्दी में लिखना शुरू करें...",
    titlePlaceholder: "नोट शीर्षक",
    lineHeight: 2.2,
    fontSize: "1.08rem",
  },
  {
    value: "tamil",
    label: "Tamil",
    nativeLabel: "தமிழ்",
    description: "Elegant Tamil typography paired with a script-first writing helper.",
    badgeText: "அஆ",
    className: "font-language-tamil",
    locale: "ta",
    placeholder: "தமிழில் எழுதத் தొடங்குங்கள்...",
    titlePlaceholder: "குறிப்பு தலைப்பு",
    lineHeight: 2.2,
    fontSize: "1.08rem",
  },
  {
    value: "malayalam",
    label: "Malayalam",
    nativeLabel: "മലയാളം",
    description: "Refined Malayalam text styles with a spacious, culturally tuned editor.",
    badgeText: "അആ",
    className: "font-language-malayalam",
    locale: "ml",
    placeholder: "മലയാളത്തിൽ എഴുതാൻ തുടങ്ങൂ...",
    titlePlaceholder: "കുറിപ്പ് ശീർഷകം",
    lineHeight: 2.2,
    fontSize: "1.08rem",
  },
];

const NOTE_FONT_LIBRARY = {
  english: [
    {
      value: "literary",
      label: "Libre Baskerville",
      description: "Book-page serif for calm, premium note-taking.",
      className: "font-note-english-literary",
      previewGlyph: "Aa",
    },
    {
      value: "editorial",
      label: "IBM Plex Serif",
      description: "Sharper serif for structured notes with a stronger editorial tone.",
      className: "font-note-english-editorial",
      previewGlyph: "Aa",
    },
    {
      value: "modern",
      label: "Sora",
      description: "Modern sans option for a cleaner, more product-like notebook.",
      className: "font-note-english-modern",
      previewGlyph: "Aa",
    },
  ],
  telugu: [
    {
      value: "literary",
      label: "Noto Serif Telugu",
      description: "Classical Telugu serif for graceful long-form writing.",
      className: "font-note-telugu-literary",
      previewGlyph: "అఆ",
    },
    {
      value: "editorial",
      label: "Mandali",
      description: "Editorial Telugu with open counters and a polished newsprint rhythm.",
      className: "font-note-telugu-editorial",
      previewGlyph: "అఆ",
    },
    {
      value: "modern",
      label: "Noto Sans Telugu",
      description: "Contemporary Telugu sans for crisp, premium digital notes.",
      className: "font-note-telugu-modern",
      previewGlyph: "అఆ",
    },
  ],
  hindi: [
    {
      value: "literary",
      label: "Noto Serif Devanagari",
      description: "Elegant Devanagari serif for rich Hindi reading comfort.",
      className: "font-note-hindi-literary",
      previewGlyph: "अआ",
    },
    {
      value: "editorial",
      label: "Tiro Devanagari Hindi",
      description: "Publishing-led Hindi type with a classic literary personality.",
      className: "font-note-hindi-editorial",
      previewGlyph: "अआ",
    },
    {
      value: "modern",
      label: "Hind",
      description: "A clear, premium Hindi sans tuned for modern screen readability.",
      className: "font-note-hindi-modern",
      previewGlyph: "अआ",
    },
  ],
  tamil: [
    {
      value: "literary",
      label: "Noto Serif Tamil",
      description: "Classical Tamil serif with a quiet, book-like cadence.",
      className: "font-note-tamil-literary",
      previewGlyph: "அஆ",
    },
    {
      value: "editorial",
      label: "Hind Madurai",
      description: "Premium Tamil text style with clear counters and strong rhythm.",
      className: "font-note-tamil-editorial",
      previewGlyph: "அஆ",
    },
    {
      value: "modern",
      label: "Noto Sans Tamil",
      description: "Modern Tamil sans for cleaner note layouts and lighter density.",
      className: "font-note-tamil-modern",
      previewGlyph: "அஆ",
    },
  ],
  malayalam: [
    {
      value: "literary",
      label: "Noto Serif Malayalam",
      description: "Sophisticated Malayalam serif for long notes and richer reading flow.",
      className: "font-note-malayalam-literary",
      previewGlyph: "അആ",
    },
    {
      value: "editorial",
      label: "Manjari",
      description: "Authentic Malayalam text style with a softer editorial personality.",
      className: "font-note-malayalam-editorial",
      previewGlyph: "അആ",
    },
    {
      value: "modern",
      label: "Noto Sans Malayalam",
      description: "Contemporary Malayalam sans with a clean digital finish.",
      className: "font-note-malayalam-modern",
      previewGlyph: "അആ",
    },
  ],
};

export const NOTE_FONT_OPTIONS = NOTE_FONT_LIBRARY[DEFAULT_NOTE_LANGUAGE];

const HINDI_PHYSICAL_HINTS = [
  "namaste -> नमस्ते",
  "bhaarat -> भारत",
  "shakti -> शक्ति",
  "dil -> दिल",
];

const TAMIL_PHYSICAL_HINTS = [
  "ammaa -> அம்மா",
  "tamizh -> தமிழ்",
  "kavi -> கவி",
  "malar -> மலர்",
];

export const NOTE_SCRIPT_KEYBOARDS = {
  telugu: {
    title: "తెలుగు అక్షరాల సహాయం",
    description:
      "Tap any Telugu letter, sign, or digit to place it directly into your note.",
    className: "font-note-telugu-literary",
    sections: [
      {
        title: "Vowels",
        rows: [
          ["అ", "ఆ", "ఇ", "ఈ", "ఉ", "ఊ", "ఋ", "ఎ", "ఏ", "ఐ", "ఒ", "ఓ", "ఔ", "అం", "అః"],
        ],
      },
      {
        title: "Signs",
        rows: [
          ["ా", "ి", "ీ", "ు", "ూ", "ృ", "ె", "ే", "ై", "ొ", "ో", "ౌ", "్", "ం", "ః"],
        ],
      },
      {
        title: "Consonants",
        rows: [
          ["క", "ఖ", "గ", "ఘ", "ఙ", "చ", "ఛ", "జ", "ఝ", "ఞ"],
          ["ట", "ఠ", "డ", "ఢ", "ణ", "త", "థ", "ద", "ధ", "న"],
          ["ప", "ఫ", "బ", "భ", "మ", "య", "ర", "ల", "వ", "ళ"],
          ["శ", "ష", "స", "హ", "క్ష", "ఱ"],
        ],
      },
      {
        title: "Digits",
        rows: [["౦", "౧", "౨", "౩", "౪", "౫", "౬", "౭", "౮", "౯"]],
      },
    ],
  },
  hindi: {
    title: "हिन्दी अक्षर सहायता",
    description:
      "Tap Devanagari letters, matras, and digits to insert them into the note instantly.",
    className: "font-note-hindi-literary",
    physicalHints: HINDI_PHYSICAL_HINTS,
    sections: [
      {
        title: "Vowels",
        rows: [
          ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "अं", "अः", "अँ"],
        ],
      },
      {
        title: "Matras",
        rows: [
          ["ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "्", "ं", "ः", "ँ"],
        ],
      },
      {
        title: "Consonants",
        rows: [
          ["क", "ख", "ग", "घ", "ङ", "च", "छ", "ज", "झ", "ञ"],
          ["ट", "ठ", "ड", "ढ", "ण", "त", "थ", "द", "ध", "न"],
          ["प", "फ", "ब", "भ", "म", "य", "र", "ल", "व"],
          ["श", "ष", "स", "ह", "क्ष", "त्र", "ज्ञ"],
        ],
      },
      {
        title: "Digits and marks",
        rows: [
          ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
          ["।", "॥", "₹"],
        ],
      },
    ],
  },
  tamil: {
    title: "தமிழ் எழுத்து உதவி",
    description:
      "Tap Tamil letters, vowel signs, and numerals to build words directly in the editor.",
    className: "font-note-tamil-literary",
    physicalHints: TAMIL_PHYSICAL_HINTS,
    sections: [
      {
        title: "Vowels",
        rows: [
          ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ", "ஃ"],
        ],
      },
      {
        title: "Signs",
        rows: [
          ["ா", "ி", "ீ", "ு", "ூ", "ெ", "ே", "ை", "ொ", "ோ", "ௌ", "்", "ஂ"],
        ],
      },
      {
        title: "Consonants",
        rows: [
          ["க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம"],
          ["ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன"],
          ["ஜ", "ஷ", "ஸ", "ஹ", "க்ஷ"],
        ],
      },
      {
        title: "Digits",
        rows: [["௦", "௧", "௨", "௩", "௪", "௫", "௬", "௭", "௮", "௯"]],
      },
    ],
  },
  malayalam: {
    title: "മലയാള അക്ഷര സഹായം",
    description:
      "Tap Malayalam letters, vowel signs, and numerals to insert them straight into the note.",
    className: "font-note-malayalam-literary",
    sections: [
      {
        title: "Vowels",
        rows: [
          ["അ", "ആ", "ഇ", "ഈ", "ഉ", "ഊ", "ഋ", "എ", "ഏ", "ഐ", "ഒ", "ഓ", "ഔ", "അം", "അഃ"],
        ],
      },
      {
        title: "Signs",
        rows: [
          ["ാ", "ി", "ീ", "ു", "ൂ", "ൃ", "െ", "േ", "ൈ", "ൊ", "ോ", "ൌ", "്", "ം", "ഃ"],
        ],
      },
      {
        title: "Consonants",
        rows: [
          ["ക", "ഖ", "ഗ", "ഘ", "ങ", "ച", "ഛ", "ജ", "ഝ", "ഞ"],
          ["ട", "ഠ", "ഡ", "ഢ", "ണ", "ത", "ഥ", "ദ", "ധ", "ന"],
          ["പ", "ഫ", "ബ", "ഭ", "മ", "യ", "ര", "ല", "വ"],
          ["ശ", "ഷ", "സ", "ഹ", "ള", "ഴ", "റ", "ക്ഷ"],
        ],
      },
      {
        title: "Digits",
        rows: [["൦", "൧", "൨", "൩", "൪", "൫", "൬", "൭", "൮", "൯"]],
      },
    ],
  },
};

NOTE_SCRIPT_KEYBOARDS.telugu = TELUGU_SCRIPT_KEYBOARD;
NOTE_SCRIPT_KEYBOARDS.hindi = HINDI_LOCAL_SCRIPT_KEYBOARD;
NOTE_SCRIPT_KEYBOARDS.tamil = TAMIL_LOCAL_SCRIPT_KEYBOARD;
NOTE_SCRIPT_KEYBOARDS.malayalam = MALAYALAM_SCRIPT_KEYBOARD;

const SCRIPT_LANGUAGE_INPUTS = {
  telugu: {
    googleLanguageCode: "te",
    supportsLocalRomanInput: true,
    transliterateRomanInput: transliterateRomanToTelugu,
    digitMap: TELUGU_DIGIT_MAP,
    keyboard: TELUGU_SCRIPT_KEYBOARD,
    physicalHints: TELUGU_PHYSICAL_HINTS,
    interactionLabel: "Tap or type",
  },
  hindi: {
    googleLanguageCode: "hi",
    supportsLocalRomanInput: true,
    transliterateRomanInput: transliterateRomanToHindi,
    digitMap: HINDI_DIGIT_MAP,
    keyboard: HINDI_LOCAL_SCRIPT_KEYBOARD,
    physicalHints: HINDI_PHYSICAL_HINTS,
    interactionLabel: "Tap or type",
  },
  tamil: {
    googleLanguageCode: "ta",
    supportsLocalRomanInput: true,
    transliterateRomanInput: transliterateRomanToTamil,
    digitMap: TAMIL_DIGIT_MAP,
    keyboard: TAMIL_LOCAL_SCRIPT_KEYBOARD,
    physicalHints: TAMIL_PHYSICAL_HINTS,
    interactionLabel: "Tap or type",
  },
  malayalam: {
    googleLanguageCode: null,
    supportsLocalRomanInput: true,
    transliterateRomanInput: transliterateRomanToMalayalam,
    digitMap: MALAYALAM_DIGIT_MAP,
    keyboard: MALAYALAM_SCRIPT_KEYBOARD,
    physicalHints: MALAYALAM_PHYSICAL_HINTS,
    interactionLabel: "Tap or type",
  },
};

export const NOTE_COLOR_PRESETS = [
  { value: "#fff8ee", label: "Ivory Paper" },
  { value: "#fff2f2", label: "Rose Paper" },
  { value: "#f4faef", label: "Sage Paper" },
  { value: "#f2f7ff", label: "Sky Paper" },
  { value: "#fff7e8", label: "Cream Paper" },
];

export const CODE_FONT_OPTIONS = [
  {
    value: "studio",
    label: "JetBrains Mono",
    description: "Balanced default with a polished developer-friendly rhythm.",
    className: "font-code-studio",
    sampleText: `const theme = "premium";\nreturn fonts[theme] ?? "studio";`,
  },
  {
    value: "technical",
    label: "IBM Plex Mono",
    description: "Stricter mono texture with a more technical engineering tone.",
    className: "font-code-technical",
    sampleText: `function saveWorkspace(id) {\n  return update(id, { synced: true });\n}`,
  },
  {
    value: "clean",
    label: "Source Code Pro",
    description: "Lighter and clearer if you want code to feel quieter.",
    className: "font-code-clean",
    sampleText: `if (draft.isDirty) {\n  persistDraft(draft);\n}`,
  },
];

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(value) {
  const normalized = normalizeNoteColor(value);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function mixRgb(fromRgb, toRgb, ratio) {
  return {
    r: clampChannel(fromRgb.r + (toRgb.r - fromRgb.r) * ratio),
    g: clampChannel(fromRgb.g + (toRgb.g - fromRgb.g) * ratio),
    b: clampChannel(fromRgb.b + (toRgb.b - fromRgb.b) * ratio),
  };
}

function rgba(rgb, alpha) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function rgbToHex(rgb) {
  const parts = [rgb.r, rgb.g, rgb.b].map((channel) =>
    clampChannel(channel).toString(16).padStart(2, "0")
  );
  return `#${parts.join("")}`;
}

export function normalizeNoteColor(value) {
  if (typeof value !== "string") return DEFAULT_NOTE_COLOR;
  const normalized = value.trim();
  if (!NOTE_COLOR_REGEX.test(normalized)) return DEFAULT_NOTE_COLOR;
  return normalized.toLowerCase();
}

export function toNotePaperColor(value) {
  const baseRgb = hexToRgb(value);
  const white = { r: 255, g: 255, b: 255 };
  return rgbToHex(mixRgb(baseRgb, white, 0.82));
}

export function getNoteLanguageOption(value) {
  return (
    NOTE_LANGUAGE_OPTIONS.find((option) => option.value === value) ??
    NOTE_LANGUAGE_OPTIONS[0]
  );
}

export function getNoteFontOptions(language = DEFAULT_NOTE_LANGUAGE) {
  const { value } = getNoteLanguageOption(language);
  return NOTE_FONT_LIBRARY[value] ?? NOTE_FONT_LIBRARY[DEFAULT_NOTE_LANGUAGE];
}

export function getNoteFontOption(
  language = DEFAULT_NOTE_LANGUAGE,
  style = DEFAULT_NOTE_FONT_STYLE
) {
  return (
    getNoteFontOptions(language).find((option) => option.value === style) ??
    getNoteFontOptions(language)[0]
  );
}

export function getCodeFontOption(value) {
  return (
    CODE_FONT_OPTIONS.find((option) => option.value === value) ??
    CODE_FONT_OPTIONS[0]
  );
}

export function getNoteFontClassName(
  language = DEFAULT_NOTE_LANGUAGE,
  style = DEFAULT_NOTE_FONT_STYLE
) {
  return getNoteFontOption(language, style).className;
}

export function getCodeFontClassName(value) {
  return getCodeFontOption(value).className;
}

export function getScriptLanguageConfig(language = DEFAULT_NOTE_LANGUAGE) {
  return SCRIPT_LANGUAGE_INPUTS[language] ?? null;
}

export function getGoogleTransliterationLanguageCode(
  language = DEFAULT_NOTE_LANGUAGE
) {
  return getScriptLanguageConfig(language)?.googleLanguageCode ?? null;
}

export function transliterateRomanInput(
  language = DEFAULT_NOTE_LANGUAGE,
  input = ""
) {
  const transliterator = getScriptLanguageConfig(language)?.transliterateRomanInput;
  return transliterator ? transliterator(input) : input;
}

export function getLanguageDigitMap(language = DEFAULT_NOTE_LANGUAGE) {
  return getScriptLanguageConfig(language)?.digitMap ?? null;
}

export function getNoteScriptKeyboard(language = DEFAULT_NOTE_LANGUAGE) {
  return getScriptLanguageConfig(language)?.keyboard ?? NOTE_SCRIPT_KEYBOARDS[language] ?? null;
}

export function getLanguageTransliterationMessage({
  language = DEFAULT_NOTE_LANGUAGE,
  languageLabel = "",
  googleStatus = { checked: false, configured: false, supportedLanguages: [] },
  isGoogleTransliterationEnabled = false,
} = {}) {
  const scriptConfig = getScriptLanguageConfig(language);
  if (!scriptConfig) {
    return null;
  }

  if (language === "malayalam") {
    return "Premium local Malayalam transliteration is active from the physical keyboard. Google transliteration is not currently available for Malayalam.";
  }

  if (language === "telugu") {
    if (isGoogleTransliterationEnabled) {
      return "Google transliteration is refining Telugu typing when you pause for a moment.";
    }

    return googleStatus.checked
      ? "Local Telugu transliteration is active. Add Google credentials on the server to upgrade it."
      : "Checking Google transliteration availability...";
  }

  if (scriptConfig.googleLanguageCode) {
    if (scriptConfig.supportsLocalRomanInput && isGoogleTransliterationEnabled) {
      return `Local ${languageLabel} transliteration is active, and Google is refining it when you pause for a moment.`;
    }

    if (scriptConfig.supportsLocalRomanInput) {
      return googleStatus.checked
        ? `Local ${languageLabel} transliteration is active from the physical keyboard. Add Google credentials on the server if you want cloud refinement too.`
        : `Local ${languageLabel} transliteration is active from the physical keyboard. Checking Google refinement availability...`;
    }

    if (isGoogleTransliterationEnabled) {
      return `Google transliteration is active for ${languageLabel} physical keyboard typing.`;
    }

    return googleStatus.checked
      ? `Tap layout is ready. Add Google credentials on the server to enable ${languageLabel} physical keyboard transliteration.`
      : "Checking Google transliteration availability...";
  }

  return scriptConfig.supportsLocalRomanInput
    ? `${languageLabel} local transliteration is active from the physical keyboard.`
    : null;
}

export function getNoteSurfaceStyle(value) {
  const normalized = normalizeNoteColor(value);
  const baseRgb = hexToRgb(normalized);
  const deepShadow = { r: 90, g: 68, b: 48 };
  const borderRgb = mixRgb(baseRgb, deepShadow, 0.08);
  const shadowRgb = mixRgb(baseRgb, deepShadow, 0.4);

  return {
    borderColor: rgba(borderRgb, 0.18),
    backgroundColor: normalized,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.88), 0 18px 36px ${rgba(
      shadowRgb,
      0.08
    )}`,
  };
}

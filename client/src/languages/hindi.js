const HINDI_VOWELS = [
  { roman: "au", letter: "औ", sign: "ौ" },
  { roman: "ai", letter: "ऐ", sign: "ै" },
  { roman: "aa", letter: "आ", sign: "ा" },
  { roman: "ii", letter: "ई", sign: "ी" },
  { roman: "uu", letter: "ऊ", sign: "ू" },
  { roman: "ri", letter: "ऋ", sign: "ृ" },
  { roman: "ee", letter: "ए", sign: "े" },
  { roman: "oo", letter: "ओ", sign: "ो" },
  { roman: "a", letter: "अ", sign: "" },
  { roman: "i", letter: "इ", sign: "ि" },
  { roman: "u", letter: "उ", sign: "ु" },
  { roman: "e", letter: "ए", sign: "े" },
  { roman: "o", letter: "ओ", sign: "ो" },
];

const HINDI_CONSONANTS = [
  { roman: "ksh", letter: "क्ष" },
  { roman: "chh", letter: "छ" },
  { roman: "kh", letter: "ख" },
  { roman: "gh", letter: "घ" },
  { roman: "ch", letter: "च" },
  { roman: "jh", letter: "झ" },
  { roman: "Th", letter: "ठ" },
  { roman: "Dh", letter: "ढ" },
  { roman: "th", letter: "थ" },
  { roman: "dh", letter: "ध" },
  { roman: "ph", letter: "फ" },
  { roman: "bh", letter: "भ" },
  { roman: "sh", letter: "श" },
  { roman: "ng", letter: "ङ" },
  { roman: "ny", letter: "ञ" },
  { roman: "tr", letter: "त्र" },
  { roman: "gy", letter: "ज्ञ" },
  { roman: "gn", letter: "ज्ञ" },
  { roman: "k", letter: "क" },
  { roman: "g", letter: "ग" },
  { roman: "c", letter: "च" },
  { roman: "j", letter: "ज" },
  { roman: "T", letter: "ट" },
  { roman: "D", letter: "ड" },
  { roman: "N", letter: "ण" },
  { roman: "t", letter: "त" },
  { roman: "d", letter: "द" },
  { roman: "n", letter: "न" },
  { roman: "p", letter: "प" },
  { roman: "b", letter: "ब" },
  { roman: "m", letter: "म" },
  { roman: "y", letter: "य" },
  { roman: "r", letter: "र" },
  { roman: "l", letter: "ल" },
  { roman: "v", letter: "व" },
  { roman: "w", letter: "व" },
  { roman: "S", letter: "ष" },
  { roman: "s", letter: "स" },
  { roman: "h", letter: "ह" },
];

const HINDI_SYMBOLS = [
  { roman: "M", letter: "ं" },
  { roman: "H", letter: "ः" },
  { roman: "~", letter: "ँ" },
];

const HINDI_ROMAN_ALIASES = [
  ["shh", "S"],
  ["tth", "Th"],
  ["ddh", "Dh"],
  ["tt", "T"],
  ["dd", "D"],
  ["nn", "N"],
];

export const HINDI_DIGIT_MAP = {
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
};

const HINDI_VOWEL_HINTS = [
  [
    { symbol: "अ", hint: "a" },
    { symbol: "आ", hint: "aa" },
    { symbol: "इ", hint: "i" },
    { symbol: "ई", hint: "ii" },
    { symbol: "उ", hint: "u" },
    { symbol: "ऊ", hint: "uu" },
    { symbol: "ऋ", hint: "ri" },
    { symbol: "ए", hint: "e" },
    { symbol: "ऐ", hint: "ai" },
    { symbol: "ओ", hint: "o" },
    { symbol: "औ", hint: "au" },
    { symbol: "अं", hint: "aM" },
    { symbol: "अः", hint: "aH" },
    { symbol: "अँ", hint: "a~" },
  ],
];

const HINDI_SIGN_HINTS = [
  [
    { symbol: "ा", hint: "aa" },
    { symbol: "ि", hint: "i" },
    { symbol: "ी", hint: "ii" },
    { symbol: "ु", hint: "u" },
    { symbol: "ू", hint: "uu" },
    { symbol: "ृ", hint: "ri" },
    { symbol: "े", hint: "e" },
    { symbol: "ै", hint: "ai" },
    { symbol: "ो", hint: "o" },
    { symbol: "ौ", hint: "au" },
    { symbol: "्", hint: "x" },
    { symbol: "ं", hint: "M" },
    { symbol: "ः", hint: "H" },
    { symbol: "ँ", hint: "~" },
  ],
];

const HINDI_CONSONANT_HINTS = [
  [
    { symbol: "क", hint: "k" },
    { symbol: "ख", hint: "kh" },
    { symbol: "ग", hint: "g" },
    { symbol: "घ", hint: "gh" },
    { symbol: "ङ", hint: "ng" },
    { symbol: "च", hint: "c" },
    { symbol: "छ", hint: "chh" },
    { symbol: "ज", hint: "j" },
    { symbol: "झ", hint: "jh" },
    { symbol: "ञ", hint: "ny" },
  ],
  [
    { symbol: "ट", hint: "T" },
    { symbol: "ठ", hint: "Th" },
    { symbol: "ड", hint: "D" },
    { symbol: "ढ", hint: "Dh" },
    { symbol: "ण", hint: "N" },
    { symbol: "त", hint: "t" },
    { symbol: "थ", hint: "th" },
    { symbol: "द", hint: "d" },
    { symbol: "ध", hint: "dh" },
    { symbol: "न", hint: "n" },
  ],
  [
    { symbol: "प", hint: "p" },
    { symbol: "फ", hint: "ph" },
    { symbol: "ब", hint: "b" },
    { symbol: "भ", hint: "bh" },
    { symbol: "म", hint: "m" },
    { symbol: "य", hint: "y" },
    { symbol: "र", hint: "r" },
    { symbol: "ल", hint: "l" },
    { symbol: "व", hint: "v / w" },
  ],
  [
    { symbol: "श", hint: "sh" },
    { symbol: "ष", hint: "S" },
    { symbol: "स", hint: "s" },
    { symbol: "ह", hint: "h" },
    { symbol: "क्ष", hint: "ksh" },
    { symbol: "त्र", hint: "tr" },
    { symbol: "ज्ञ", hint: "gy" },
  ],
];

function matchRoman(entryRoman, input, index) {
  if (input.length - index < entryRoman.length) return false;

  for (let i = 0; i < entryRoman.length; i++) {
    const eChar = entryRoman[i];
    const iChar = input[index + i];
    if (eChar === iChar) continue;

    if (eChar.toLowerCase() !== iChar.toLowerCase()) {
      return false;
    }

    const lower = eChar.toLowerCase();
    if (
      lower === "t" ||
      lower === "d" ||
      lower === "n" ||
      lower === "s" ||
      lower === "l" ||
      lower === "r" ||
      lower === "m" ||
      lower === "h" ||
      lower === "x"
    ) {
      return false;
    }
  }

  return true;
}

function getLongestMatch(input, index, entries) {
  for (const entry of entries) {
    if (matchRoman(entry.roman, input, index)) {
      return entry;
    }
  }

  return null;
}

function normalizeHindiRomanInput(input) {
  let normalized = input;

  for (const [pattern, replacement] of HINDI_ROMAN_ALIASES) {
    normalized = normalized.replaceAll(pattern, replacement);
  }

  return normalized;
}

export const HINDI_PHYSICAL_HINTS = [
  "tta / dda / nna -> retroflex sounds",
  "namaste -> नमस्ते",
  "bhaarat -> भारत",
  "shakti -> शक्ति",
  "dil -> दिल",
];

export const HINDI_SCRIPT_KEYBOARD = {
  title: "हिन्दी अक्षर सहायता",
  description:
    "Tap Hindi letters or type phonetically from your physical keyboard using the hints shown on each key.",
  className: "font-note-hindi-literary",
  interactionLabel: "Tap or type",
  physicalHints: HINDI_PHYSICAL_HINTS,
  sections: [
    {
      title: "Vowels",
      rows: HINDI_VOWEL_HINTS,
    },
    {
      title: "Matras",
      rows: HINDI_SIGN_HINTS,
    },
    {
      title: "Consonants",
      rows: HINDI_CONSONANT_HINTS,
    },
    {
      title: "Digits",
      rows: [
        [
          { symbol: "०", hint: "0" },
          { symbol: "१", hint: "1" },
          { symbol: "२", hint: "2" },
          { symbol: "३", hint: "3" },
          { symbol: "४", hint: "4" },
          { symbol: "५", hint: "5" },
          { symbol: "६", hint: "6" },
          { symbol: "७", hint: "7" },
          { symbol: "८", hint: "8" },
          { symbol: "९", hint: "9" },
        ],
      ],
    },
  ],
};

export function transliterateRomanToHindi(input) {
  if (!input) return "";
  const source = normalizeHindiRomanInput(input);

  let output = "";
  let index = 0;

  while (index < source.length) {
    const consonant = getLongestMatch(source, index, HINDI_CONSONANTS);
    if (consonant) {
      let syllable = consonant.letter;
      index += consonant.roman.length;

      while (index < source.length) {
        if (source[index] === "x") {
          syllable += "्";
          index += 1;

          const explicitNextConsonant = getLongestMatch(
            source,
            index,
            HINDI_CONSONANTS
          );
          if (explicitNextConsonant) {
            syllable += explicitNextConsonant.letter;
            index += explicitNextConsonant.roman.length;
            continue;
          }

          output += syllable;
          syllable = "";
          break;
        }

        const vowel = getLongestMatch(source, index, HINDI_VOWELS);
        if (vowel) {
          syllable += vowel.sign;
          index += vowel.roman.length;
          output += syllable;
          syllable = "";
          break;
        }

        const nextConsonant = getLongestMatch(source, index, HINDI_CONSONANTS);
        if (nextConsonant) {
          syllable += `्${nextConsonant.letter}`;
          index += nextConsonant.roman.length;
          continue;
        }

        output += syllable;
        syllable = "";
        break;
      }

      if (syllable) {
        output += syllable;
      }
      continue;
    }

    const vowel = getLongestMatch(source, index, HINDI_VOWELS);
    if (vowel) {
      output += vowel.letter;
      index += vowel.roman.length;
      continue;
    }

    const symbol = getLongestMatch(source, index, HINDI_SYMBOLS);
    if (symbol) {
      output += symbol.letter;
      index += symbol.roman.length;
      continue;
    }

    output += source[index];
    index += 1;
  }

  return output;
}

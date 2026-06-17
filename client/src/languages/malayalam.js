const MALAYALAM_VOWELS = [
  { roman: "au", letter: "ഔ", sign: "ൌ" },
  { roman: "ai", letter: "ഐ", sign: "ൈ" },
  { roman: "aa", letter: "ആ", sign: "ാ" },
  { roman: "ii", letter: "ഈ", sign: "ീ" },
  { roman: "uu", letter: "ഊ", sign: "ൂ" },
  { roman: "ru", letter: "ഋ", sign: "ൃ" },
  { roman: "ee", letter: "ഏ", sign: "േ" },
  { roman: "oo", letter: "ഓ", sign: "ോ" },
  { roman: "a", letter: "അ", sign: "" },
  { roman: "i", letter: "ഇ", sign: "ി" },
  { roman: "u", letter: "ഉ", sign: "ു" },
  { roman: "e", letter: "എ", sign: "െ" },
  { roman: "o", letter: "ഒ", sign: "ൊ" },
];

const MALAYALAM_CONSONANTS = [
  { roman: "ksh", letter: "ക്ഷ" },
  { roman: "kh", letter: "ഖ" },
  { roman: "gh", letter: "ഘ" },
  { roman: "ch", letter: "ഛ" },
  { roman: "jh", letter: "ഝ" },
  { roman: "Th", letter: "ഠ" },
  { roman: "Dh", letter: "ഢ" },
  { roman: "th", letter: "ഥ" },
  { roman: "dh", letter: "ധ" },
  { roman: "ph", letter: "ഫ" },
  { roman: "bh", letter: "ഭ" },
  { roman: "sh", letter: "ശ" },
  { roman: "zh", letter: "ഴ" },
  { roman: "ng", letter: "ങ" },
  { roman: "ny", letter: "ഞ" },
  { roman: "tr", letter: "ത്ര" },
  { roman: "gn", letter: "ജ്ഞ" },
  { roman: "k", letter: "ക" },
  { roman: "g", letter: "ഗ" },
  { roman: "c", letter: "ച" },
  { roman: "j", letter: "ജ" },
  { roman: "T", letter: "ട" },
  { roman: "D", letter: "ഡ" },
  { roman: "N", letter: "ണ" },
  { roman: "t", letter: "ത" },
  { roman: "d", letter: "ദ" },
  { roman: "n", letter: "ന" },
  { roman: "p", letter: "പ" },
  { roman: "b", letter: "ബ" },
  { roman: "m", letter: "മ" },
  { roman: "y", letter: "യ" },
  { roman: "r", letter: "ര" },
  { roman: "l", letter: "ല" },
  { roman: "v", letter: "വ" },
  { roman: "L", letter: "ള" },
  { roman: "R", letter: "റ" },
  { roman: "S", letter: "ഷ" },
  { roman: "s", letter: "സ" },
  { roman: "h", letter: "ഹ" },
];

const MALAYALAM_SYMBOLS = [
  { roman: "M", letter: "ം" },
  { roman: "H", letter: "ഃ" },
];

const MALAYALAM_ROMAN_ALIASES = [
  ["shh", "S"],
  ["tth", "Th"],
  ["ddh", "Dh"],
  ["tt", "T"],
  ["dd", "D"],
  ["nn", "N"],
  ["ll", "L"],
  ["rr", "R"],
];

export const MALAYALAM_DIGIT_MAP = {
  "0": "൦",
  "1": "൧",
  "2": "൨",
  "3": "൩",
  "4": "൪",
  "5": "൫",
  "6": "൬",
  "7": "൭",
  "8": "൮",
  "9": "൯",
};

const MALAYALAM_VOWEL_HINTS = [
  [
    { symbol: "അ", hint: "a" },
    { symbol: "ആ", hint: "aa" },
    { symbol: "ഇ", hint: "i" },
    { symbol: "ഈ", hint: "ii" },
    { symbol: "ഉ", hint: "u" },
    { symbol: "ഊ", hint: "uu" },
    { symbol: "ഋ", hint: "ru" },
    { symbol: "എ", hint: "e" },
    { symbol: "ഏ", hint: "ee" },
    { symbol: "ഐ", hint: "ai" },
    { symbol: "ഒ", hint: "o" },
    { symbol: "ഓ", hint: "oo" },
    { symbol: "ഔ", hint: "au" },
    { symbol: "അം", hint: "aM" },
    { symbol: "അഃ", hint: "aH" },
  ],
];

const MALAYALAM_SIGN_HINTS = [
  [
    { symbol: "ാ", hint: "aa" },
    { symbol: "ി", hint: "i" },
    { symbol: "ീ", hint: "ii" },
    { symbol: "ു", hint: "u" },
    { symbol: "ൂ", hint: "uu" },
    { symbol: "ൃ", hint: "ru" },
    { symbol: "െ", hint: "e" },
    { symbol: "േ", hint: "ee" },
    { symbol: "ൈ", hint: "ai" },
    { symbol: "ൊ", hint: "o" },
    { symbol: "ോ", hint: "oo" },
    { symbol: "ൌ", hint: "au" },
    { symbol: "്", hint: "x" },
    { symbol: "ം", hint: "M" },
    { symbol: "ഃ", hint: "H" },
  ],
];

const MALAYALAM_CONSONANT_HINTS = [
  [
    { symbol: "ക", hint: "k" },
    { symbol: "ഖ", hint: "kh" },
    { symbol: "ഗ", hint: "g" },
    { symbol: "ഘ", hint: "gh" },
    { symbol: "ങ", hint: "ng" },
    { symbol: "ച", hint: "c" },
    { symbol: "ഛ", hint: "ch" },
    { symbol: "ജ", hint: "j" },
    { symbol: "ഝ", hint: "jh" },
    { symbol: "ഞ", hint: "ny" },
  ],
  [
    { symbol: "ട", hint: "T" },
    { symbol: "ഠ", hint: "Th" },
    { symbol: "ഡ", hint: "D" },
    { symbol: "ഢ", hint: "Dh" },
    { symbol: "ണ", hint: "N" },
    { symbol: "ത", hint: "t" },
    { symbol: "ഥ", hint: "th" },
    { symbol: "ദ", hint: "d" },
    { symbol: "ധ", hint: "dh" },
    { symbol: "ന", hint: "n" },
  ],
  [
    { symbol: "പ", hint: "p" },
    { symbol: "ഫ", hint: "ph" },
    { symbol: "ബ", hint: "b" },
    { symbol: "ഭ", hint: "bh" },
    { symbol: "മ", hint: "m" },
    { symbol: "യ", hint: "y" },
    { symbol: "ര", hint: "r" },
    { symbol: "ല", hint: "l" },
    { symbol: "വ", hint: "v" },
    { symbol: "ള", hint: "L" },
  ],
  [
    { symbol: "ശ", hint: "sh" },
    { symbol: "ഷ", hint: "S" },
    { symbol: "സ", hint: "s" },
    { symbol: "ഹ", hint: "h" },
    { symbol: "ഴ", hint: "zh" },
    { symbol: "റ", hint: "R" },
    { symbol: "ത്ര", hint: "tr" },
    { symbol: "ജ്ഞ", hint: "gn" },
    { symbol: "ക്ഷ", hint: "ksh" },
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

function normalizeMalayalamRomanInput(input) {
  let normalized = input;

  for (const [pattern, replacement] of MALAYALAM_ROMAN_ALIASES) {
    normalized = normalized.replaceAll(pattern, replacement);
  }

  return normalized;
}

export const MALAYALAM_PHYSICAL_HINTS = [
  "tt / nn / ll / rr -> alternate Malayalam sounds",
  "amma -> അമ്മ",
  "keralam -> കേരളം",
  "malayalam -> മലയാളം",
  "namaskaram -> നമസ്കാരം",
];

export const MALAYALAM_SCRIPT_KEYBOARD = {
  title: "മലയാള അക്ഷര സഹായം",
  description:
    "Tap Malayalam letters or type phonetically from your physical keyboard using the hints shown on each key.",
  className: "font-note-malayalam-literary",
  interactionLabel: "Tap or type",
  physicalHints: MALAYALAM_PHYSICAL_HINTS,
  sections: [
    {
      title: "Vowels",
      rows: MALAYALAM_VOWEL_HINTS,
    },
    {
      title: "Signs",
      rows: MALAYALAM_SIGN_HINTS,
    },
    {
      title: "Consonants",
      rows: MALAYALAM_CONSONANT_HINTS,
    },
    {
      title: "Digits",
      rows: [
        [
          { symbol: "൦", hint: "0" },
          { symbol: "൧", hint: "1" },
          { symbol: "൨", hint: "2" },
          { symbol: "൩", hint: "3" },
          { symbol: "൪", hint: "4" },
          { symbol: "൫", hint: "5" },
          { symbol: "൬", hint: "6" },
          { symbol: "൭", hint: "7" },
          { symbol: "൮", hint: "8" },
          { symbol: "൯", hint: "9" },
        ],
      ],
    },
  ],
};

export function transliterateRomanToMalayalam(input) {
  if (!input) return "";
  const source = normalizeMalayalamRomanInput(input);

  let output = "";
  let index = 0;

  while (index < source.length) {
    const consonant = getLongestMatch(source, index, MALAYALAM_CONSONANTS);
    if (consonant) {
      let syllable = consonant.letter;
      index += consonant.roman.length;

      while (index < source.length) {
        if (source[index] === "x") {
          syllable += "്";
          index += 1;

          const explicitNextConsonant = getLongestMatch(
            source,
            index,
            MALAYALAM_CONSONANTS
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

        const vowel = getLongestMatch(source, index, MALAYALAM_VOWELS);
        if (vowel) {
          syllable += vowel.sign;
          index += vowel.roman.length;
          output += syllable;
          syllable = "";
          break;
        }

        const nextConsonant = getLongestMatch(source, index, MALAYALAM_CONSONANTS);
        if (nextConsonant) {
          syllable += `്${nextConsonant.letter}`;
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

    const vowel = getLongestMatch(source, index, MALAYALAM_VOWELS);
    if (vowel) {
      output += vowel.letter;
      index += vowel.roman.length;
      continue;
    }

    const symbol = getLongestMatch(source, index, MALAYALAM_SYMBOLS);
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

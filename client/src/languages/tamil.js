const TAMIL_VOWELS = [
  { roman: "au", letter: "ஔ", sign: "ௌ" },
  { roman: "ai", letter: "ஐ", sign: "ை" },
  { roman: "aa", letter: "ஆ", sign: "ா" },
  { roman: "ii", letter: "ஈ", sign: "ீ" },
  { roman: "uu", letter: "ஊ", sign: "ூ" },
  { roman: "ee", letter: "ஏ", sign: "ே" },
  { roman: "oo", letter: "ஓ", sign: "ோ" },
  { roman: "a", letter: "அ", sign: "" },
  { roman: "i", letter: "இ", sign: "ி" },
  { roman: "u", letter: "உ", sign: "ு" },
  { roman: "e", letter: "எ", sign: "ெ" },
  { roman: "o", letter: "ஒ", sign: "ொ" },
];

const TAMIL_CONSONANTS = [
  { roman: "ksh", letter: "க்ஷ" },
  { roman: "ng", letter: "ங" },
  { roman: "ny", letter: "ஞ" },
  { roman: "zh", letter: "ழ" },
  { roman: "tr", letter: "ற்ற" },
  { roman: "sh", letter: "ஷ" },
  { roman: "ch", letter: "ச" },
  { roman: "kh", letter: "க" },
  { roman: "gh", letter: "க" },
  { roman: "jh", letter: "ஜ" },
  { roman: "th", letter: "த" },
  { roman: "dh", letter: "த" },
  { roman: "ph", letter: "ப" },
  { roman: "bh", letter: "ப" },
  { roman: "k", letter: "க" },
  { roman: "g", letter: "க" },
  { roman: "c", letter: "ச" },
  { roman: "j", letter: "ஜ" },
  { roman: "T", letter: "ட" },
  { roman: "D", letter: "ட" },
  { roman: "N", letter: "ண" },
  { roman: "t", letter: "த" },
  { roman: "d", letter: "த" },
  { roman: "n", letter: "ந" },
  { roman: "p", letter: "ப" },
  { roman: "b", letter: "ப" },
  { roman: "m", letter: "ம" },
  { roman: "y", letter: "ய" },
  { roman: "r", letter: "ர" },
  { roman: "l", letter: "ல" },
  { roman: "v", letter: "வ" },
  { roman: "L", letter: "ள" },
  { roman: "R", letter: "ற" },
  { roman: "S", letter: "ஸ" },
  { roman: "s", letter: "ச" },
  { roman: "h", letter: "ஹ" },
];

const TAMIL_SYMBOLS = [
  { roman: "M", letter: "ஂ" },
  { roman: "H", letter: "ஃ" },
];

const TAMIL_ROMAN_ALIASES = [
  ["shh", "S"],
  ["tt", "T"],
  ["dd", "D"],
  ["nn", "N"],
  ["ll", "L"],
  ["rr", "R"],
];

export const TAMIL_DIGIT_MAP = {
  "0": "௦",
  "1": "௧",
  "2": "௨",
  "3": "௩",
  "4": "௪",
  "5": "௫",
  "6": "௬",
  "7": "௭",
  "8": "௮",
  "9": "௯",
};

const TAMIL_VOWEL_HINTS = [
  [
    { symbol: "அ", hint: "a" },
    { symbol: "ஆ", hint: "aa" },
    { symbol: "இ", hint: "i" },
    { symbol: "ஈ", hint: "ii" },
    { symbol: "உ", hint: "u" },
    { symbol: "ஊ", hint: "uu" },
    { symbol: "எ", hint: "e" },
    { symbol: "ஏ", hint: "ee" },
    { symbol: "ஐ", hint: "ai" },
    { symbol: "ஒ", hint: "o" },
    { symbol: "ஓ", hint: "oo" },
    { symbol: "ஔ", hint: "au" },
    { symbol: "ஃ", hint: "H" },
  ],
];

const TAMIL_SIGN_HINTS = [
  [
    { symbol: "ா", hint: "aa" },
    { symbol: "ி", hint: "i" },
    { symbol: "ீ", hint: "ii" },
    { symbol: "ு", hint: "u" },
    { symbol: "ூ", hint: "uu" },
    { symbol: "ெ", hint: "e" },
    { symbol: "ே", hint: "ee" },
    { symbol: "ை", hint: "ai" },
    { symbol: "ொ", hint: "o" },
    { symbol: "ோ", hint: "oo" },
    { symbol: "ௌ", hint: "au" },
    { symbol: "்", hint: "x" },
    { symbol: "ஂ", hint: "M" },
  ],
];

const TAMIL_CONSONANT_HINTS = [
  [
    { symbol: "க", hint: "k / g" },
    { symbol: "ங", hint: "ng" },
    { symbol: "ச", hint: "c / s" },
    { symbol: "ஞ", hint: "ny" },
    { symbol: "ஜ", hint: "j" },
    { symbol: "ட", hint: "T / D" },
    { symbol: "ண", hint: "N" },
    { symbol: "த", hint: "t / d" },
    { symbol: "ந", hint: "n" },
    { symbol: "ப", hint: "p / b" },
  ],
  [
    { symbol: "ம", hint: "m" },
    { symbol: "ய", hint: "y" },
    { symbol: "ர", hint: "r" },
    { symbol: "ல", hint: "l" },
    { symbol: "வ", hint: "v" },
    { symbol: "ழ", hint: "zh" },
    { symbol: "ள", hint: "L" },
    { symbol: "ற", hint: "R" },
    { symbol: "ஸ", hint: "S" },
    { symbol: "ஹ", hint: "h" },
  ],
  [
    { symbol: "ஷ", hint: "sh" },
    { symbol: "க்ஷ", hint: "ksh" },
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

function normalizeTamilRomanInput(input) {
  let normalized = input;

  for (const [pattern, replacement] of TAMIL_ROMAN_ALIASES) {
    normalized = normalized.replaceAll(pattern, replacement);
  }

  return normalized;
}

export const TAMIL_PHYSICAL_HINTS = [
  "tt / nn / ll / rr -> alternate Tamil sounds",
  "ammaa -> அம்மா",
  "tamizh -> தமிழ்",
  "kavi -> கவி",
  "malar -> மலர்",
];

export const TAMIL_SCRIPT_KEYBOARD = {
  title: "தமிழ் எழுத்து உதவி",
  description:
    "Tap Tamil letters or type phonetically from your physical keyboard using the hints shown on each key.",
  className: "font-note-tamil-literary",
  interactionLabel: "Tap or type",
  physicalHints: TAMIL_PHYSICAL_HINTS,
  sections: [
    {
      title: "Vowels",
      rows: TAMIL_VOWEL_HINTS,
    },
    {
      title: "Signs",
      rows: TAMIL_SIGN_HINTS,
    },
    {
      title: "Consonants",
      rows: TAMIL_CONSONANT_HINTS,
    },
    {
      title: "Digits",
      rows: [
        [
          { symbol: "௦", hint: "0" },
          { symbol: "௧", hint: "1" },
          { symbol: "௨", hint: "2" },
          { symbol: "௩", hint: "3" },
          { symbol: "௪", hint: "4" },
          { symbol: "௫", hint: "5" },
          { symbol: "௬", hint: "6" },
          { symbol: "௭", hint: "7" },
          { symbol: "௮", hint: "8" },
          { symbol: "௯", hint: "9" },
        ],
      ],
    },
  ],
};

export function transliterateRomanToTamil(input) {
  if (!input) return "";
  const source = normalizeTamilRomanInput(input);

  let output = "";
  let index = 0;

  while (index < source.length) {
    const consonant = getLongestMatch(source, index, TAMIL_CONSONANTS);
    if (consonant) {
      let syllable = consonant.letter;
      let hasExplicitVowel = false;
      index += consonant.roman.length;

      while (index < source.length) {
        if (source[index] === "x") {
          syllable += "்";
          index += 1;

          const explicitNextConsonant = getLongestMatch(
            source,
            index,
            TAMIL_CONSONANTS
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

        const vowel = getLongestMatch(source, index, TAMIL_VOWELS);
        if (vowel) {
          syllable += vowel.sign;
          hasExplicitVowel = true;
          index += vowel.roman.length;
          output += syllable;
          syllable = "";
          break;
        }

        const nextConsonant = getLongestMatch(source, index, TAMIL_CONSONANTS);
        if (nextConsonant) {
          syllable += `்${nextConsonant.letter}`;
          index += nextConsonant.roman.length;
          continue;
        }

        output += syllable;
        syllable = "";
        break;
      }

      if (syllable) {
        output += hasExplicitVowel ? syllable : `${syllable}்`;
      }
      continue;
    }

    const vowel = getLongestMatch(source, index, TAMIL_VOWELS);
    if (vowel) {
      output += vowel.letter;
      index += vowel.roman.length;
      continue;
    }

    const symbol = getLongestMatch(source, index, TAMIL_SYMBOLS);
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

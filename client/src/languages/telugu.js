const TELUGU_VOWELS = [
  { roman: "au", letter: "ఔ", sign: "ౌ" },
  { roman: "ai", letter: "ఐ", sign: "ై" },
  { roman: "aa", letter: "ఆ", sign: "ా" },
  { roman: "ii", letter: "ఈ", sign: "ీ" },
  { roman: "uu", letter: "ఊ", sign: "ూ" },
  { roman: "ru", letter: "ఋ", sign: "ృ" },
  { roman: "ee", letter: "ఏ", sign: "ే" },
  { roman: "oo", letter: "ఓ", sign: "ో" },
  { roman: "a", letter: "అ", sign: "" },
  { roman: "i", letter: "ఇ", sign: "ి" },
  { roman: "u", letter: "ఉ", sign: "ు" },
  { roman: "e", letter: "ఎ", sign: "ె" },
  { roman: "o", letter: "ఒ", sign: "ొ" },
];

const TELUGU_CONSONANTS = [
  { roman: "ksh", letter: "క్ష" },
  { roman: "kh", letter: "ఖ" },
  { roman: "gh", letter: "ఘ" },
  { roman: "ch", letter: "ఛ" },
  { roman: "jh", letter: "ఝ" },
  { roman: "Th", letter: "ఠ" },
  { roman: "Dh", letter: "ఢ" },
  { roman: "th", letter: "థ" },
  { roman: "dh", letter: "ధ" },
  { roman: "ph", letter: "ఫ" },
  { roman: "bh", letter: "భ" },
  { roman: "sh", letter: "శ" },
  { roman: "ng", letter: "ఙ" },
  { roman: "ny", letter: "ఞ" },
  { roman: "tr", letter: "త్ర" },
  { roman: "gn", letter: "జ్ఞ" },
  { roman: "k", letter: "క" },
  { roman: "g", letter: "గ" },
  { roman: "c", letter: "చ" },
  { roman: "j", letter: "జ" },
  { roman: "T", letter: "ట" },
  { roman: "D", letter: "డ" },
  { roman: "N", letter: "ణ" },
  { roman: "t", letter: "త" },
  { roman: "d", letter: "ద" },
  { roman: "n", letter: "న" },
  { roman: "p", letter: "ప" },
  { roman: "b", letter: "బ" },
  { roman: "m", letter: "మ" },
  { roman: "y", letter: "య" },
  { roman: "r", letter: "ర" },
  { roman: "l", letter: "ల" },
  { roman: "v", letter: "వ" },
  { roman: "L", letter: "ళ" },
  { roman: "R", letter: "ఱ" },
  { roman: "S", letter: "ష" },
  { roman: "s", letter: "స" },
  { roman: "h", letter: "హ" },
];

const TELUGU_SYMBOLS = [
  { roman: "M", letter: "ం" },
  { roman: "H", letter: "ః" },
];

const TELUGU_ROMAN_ALIASES = [
  ["shh", "S"],
  ["tth", "Th"],
  ["ddh", "Dh"],
  ["tt", "T"],
  ["dd", "D"],
  ["nn", "N"],
  ["ll", "L"],
  ["rr", "R"],
];

export const TELUGU_DIGIT_MAP = {
  "0": "౦",
  "1": "౧",
  "2": "౨",
  "3": "౩",
  "4": "౪",
  "5": "౫",
  "6": "౬",
  "7": "౭",
  "8": "౮",
  "9": "౯",
};

const TELUGU_VOWEL_HINTS = [
  [
    { symbol: "అ", hint: "a" },
    { symbol: "ఆ", hint: "aa" },
    { symbol: "ఇ", hint: "i" },
    { symbol: "ఈ", hint: "ii" },
    { symbol: "ఉ", hint: "u" },
    { symbol: "ఊ", hint: "uu" },
    { symbol: "ఋ", hint: "ru" },
    { symbol: "ఎ", hint: "e" },
    { symbol: "ఏ", hint: "ee" },
    { symbol: "ఐ", hint: "ai" },
    { symbol: "ఒ", hint: "o" },
    { symbol: "ఓ", hint: "oo" },
    { symbol: "ఔ", hint: "au" },
    { symbol: "అం", hint: "aM" },
    { symbol: "అః", hint: "aH" },
  ],
];

const TELUGU_SIGN_HINTS = [
  [
    { symbol: "ా", hint: "aa" },
    { symbol: "ి", hint: "i" },
    { symbol: "ీ", hint: "ii" },
    { symbol: "ు", hint: "u" },
    { symbol: "ూ", hint: "uu" },
    { symbol: "ృ", hint: "ru" },
    { symbol: "ె", hint: "e" },
    { symbol: "ే", hint: "ee" },
    { symbol: "ై", hint: "ai" },
    { symbol: "ొ", hint: "o" },
    { symbol: "ో", hint: "oo" },
    { symbol: "ౌ", hint: "au" },
    { symbol: "్", hint: "x" },
    { symbol: "ం", hint: "M" },
    { symbol: "ః", hint: "H" },
  ],
];

const TELUGU_CONSONANT_HINTS = [
  [
    { symbol: "క", hint: "k" },
    { symbol: "ఖ", hint: "kh" },
    { symbol: "గ", hint: "g" },
    { symbol: "ఘ", hint: "gh" },
    { symbol: "ఙ", hint: "ng" },
    { symbol: "చ", hint: "c" },
    { symbol: "ఛ", hint: "ch" },
    { symbol: "జ", hint: "j" },
    { symbol: "ఝ", hint: "jh" },
    { symbol: "ఞ", hint: "ny" },
  ],
  [
    { symbol: "ట", hint: "T" },
    { symbol: "ఠ", hint: "Th" },
    { symbol: "డ", hint: "D" },
    { symbol: "ఢ", hint: "Dh" },
    { symbol: "ణ", hint: "N" },
    { symbol: "త", hint: "t" },
    { symbol: "థ", hint: "th" },
    { symbol: "ద", hint: "d" },
    { symbol: "ధ", hint: "dh" },
    { symbol: "న", hint: "n" },
  ],
  [
    { symbol: "ప", hint: "p" },
    { symbol: "ఫ", hint: "ph" },
    { symbol: "బ", hint: "b" },
    { symbol: "భ", hint: "bh" },
    { symbol: "మ", hint: "m" },
    { symbol: "య", hint: "y" },
    { symbol: "ర", hint: "r" },
    { symbol: "ల", hint: "l" },
    { symbol: "వ", hint: "v" },
    { symbol: "ళ", hint: "L" },
  ],
  [
    { symbol: "శ", hint: "sh" },
    { symbol: "ష", hint: "S" },
    { symbol: "స", hint: "s" },
    { symbol: "హ", hint: "h" },
    { symbol: "క్ష", hint: "ksh" },
    { symbol: "ఱ", hint: "R" },
    { symbol: "త్ర", hint: "tr" },
    { symbol: "జ్ఞ", hint: "gn" },
  ],
];

const TELUGU_VATTULU_HINTS = [
  [
    { symbol: "్క", hint: "+k" },
    { symbol: "్ఖ", hint: "+kh" },
    { symbol: "్గ", hint: "+g" },
    { symbol: "్ఘ", hint: "+gh" },
    { symbol: "్ఙ", hint: "+ng" },
    { symbol: "్చ", hint: "+c" },
    { symbol: "్ఛ", hint: "+ch" },
    { symbol: "్జ", hint: "+j" },
    { symbol: "్ఝ", hint: "+jh" },
    { symbol: "్ఞ", hint: "+ny" },
  ],
  [
    { symbol: "్ట", hint: "+T" },
    { symbol: "్ఠ", hint: "+Th" },
    { symbol: "్డ", hint: "+D" },
    { symbol: "్ఢ", hint: "+Dh" },
    { symbol: "్ణ", hint: "+N" },
    { symbol: "్త", hint: "+t" },
    { symbol: "్థ", hint: "+th" },
    { symbol: "్ద", hint: "+d" },
    { symbol: "్ధ", hint: "+dh" },
    { symbol: "్న", hint: "+n" },
  ],
  [
    { symbol: "్ప", hint: "+p" },
    { symbol: "్ఫ", hint: "+ph" },
    { symbol: "్బ", hint: "+b" },
    { symbol: "్భ", hint: "+bh" },
    { symbol: "్మ", hint: "+m" },
    { symbol: "్య", hint: "+y" },
    { symbol: "్ర", hint: "+r" },
    { symbol: "్ల", hint: "+l" },
    { symbol: "్వ", hint: "+v" },
    { symbol: "్ళ", hint: "+L" },
  ],
  [
    { symbol: "్శ", hint: "+sh" },
    { symbol: "్ష", hint: "+S" },
    { symbol: "్స", hint: "+s" },
    { symbol: "్హ", hint: "+h" },
    { symbol: "్క్ష", hint: "+ksh" },
    { symbol: "్ఱ", hint: "+R" },
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

function normalizeTeluguRomanInput(input) {
  let normalized = input;

  for (const [pattern, replacement] of TELUGU_ROMAN_ALIASES) {
    normalized = normalized.replaceAll(pattern, replacement);
  }

  return normalized;
}

export const TELUGU_PHYSICAL_HINTS = [
  "tt / nn / ll / rr -> alternate Telugu sounds",
  "ka -> క",
  "kha -> ఖ",
  "kra -> క్ర",
  "kka -> క్క",
  "ksha -> క్ష",
  "kx -> క్",
  "M -> ం",
];

export const TELUGU_SCRIPT_KEYBOARD = {
  title: "తెలుగు అక్షరాల సహాయం",
  description:
    "Tap Telugu letters or type phonetically from your physical keyboard using the hints shown on each key.",
  className: "font-note-telugu-literary",
  interactionLabel: "Tap or type",
  physicalHints: TELUGU_PHYSICAL_HINTS,
  sections: [
    {
      title: "Vowels",
      rows: TELUGU_VOWEL_HINTS,
    },
    {
      title: "Signs",
      rows: TELUGU_SIGN_HINTS,
    },
    {
      title: "Consonants",
      rows: TELUGU_CONSONANT_HINTS,
    },
    {
      title: "Vattulu",
      rows: TELUGU_VATTULU_HINTS,
    },
    {
      title: "Digits",
      rows: [
        [
          { symbol: "౦", hint: "0" },
          { symbol: "౧", hint: "1" },
          { symbol: "౨", hint: "2" },
          { symbol: "౩", hint: "3" },
          { symbol: "౪", hint: "4" },
          { symbol: "౫", hint: "5" },
          { symbol: "౬", hint: "6" },
          { symbol: "౭", hint: "7" },
          { symbol: "౮", hint: "8" },
          { symbol: "౯", hint: "9" },
        ],
      ],
    },
  ],
};

export function transliterateRomanToTelugu(input) {
  if (!input) return "";
  const source = normalizeTeluguRomanInput(input);

  let output = "";
  let index = 0;

  while (index < source.length) {
    const consonant = getLongestMatch(source, index, TELUGU_CONSONANTS);
    if (consonant) {
      let syllable = consonant.letter;
      index += consonant.roman.length;

      while (index < source.length) {
        if (source[index] === "x") {
          syllable += "్";
          index += 1;

          const explicitNextConsonant = getLongestMatch(
            source,
            index,
            TELUGU_CONSONANTS
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

        const vowel = getLongestMatch(source, index, TELUGU_VOWELS);
        if (vowel) {
          syllable += vowel.sign;
          index += vowel.roman.length;
          output += syllable;
          syllable = "";
          break;
        }

        const nextConsonant = getLongestMatch(source, index, TELUGU_CONSONANTS);
        if (nextConsonant) {
          syllable += `్${nextConsonant.letter}`;
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

    const vowel = getLongestMatch(source, index, TELUGU_VOWELS);
    if (vowel) {
      output += vowel.letter;
      index += vowel.roman.length;
      continue;
    }

    const symbol = getLongestMatch(source, index, TELUGU_SYMBOLS);
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

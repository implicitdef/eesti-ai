export type MaskedHintPart = {
  char: string;
  kind: "typed" | "hintLetter" | "punctuation" | "mask";
};

export type SentenceToken =
  | { type: "word"; text: string }
  | { type: "separator"; text: string };

// Letters, optionally joined by a single hyphen/apostrophe to the next run of
// letters, so "võib-olla" is one word token instead of two.
const WORD_TOKEN_RE = /\p{L}+(?:['’-]\p{L}+)*/gu;

export function tokenizeSentence(sentence: string): SentenceToken[] {
  const tokens: SentenceToken[] = [];
  let lastIndex = 0;

  for (const match of sentence.matchAll(WORD_TOKEN_RE)) {
    const start = match.index;
    if (start > lastIndex) {
      tokens.push({
        type: "separator",
        text: sentence.slice(lastIndex, start),
      });
    }
    tokens.push({ type: "word", text: match[0] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < sentence.length) {
    tokens.push({ type: "separator", text: sentence.slice(lastIndex) });
  }

  return tokens;
}

export function wordTokenTexts(tokens: SentenceToken[]): string[] {
  return tokens
    .filter(
      (token): token is { type: "word"; text: string } => token.type === "word",
    )
    .map((token) => token.text);
}

export function joinTokensWithWordValues(
  tokens: SentenceToken[],
  wordValues: string[],
): string {
  let wordIndex = 0;
  return tokens
    .map((token) =>
      token.type === "word" ? (wordValues[wordIndex++] ?? "") : token.text,
    )
    .join("");
}

const LETTER_RE = /\p{L}/u;

function isLetter(char: string | undefined): boolean {
  return char !== undefined && LETTER_RE.test(char);
}

export function buildMaskedHintParts(
  target: string,
  typed: string,
  revealEndings = false,
  fullyRevealed = false,
): MaskedHintPart[] {
  const parts: MaskedHintPart[] = [];
  // Words longer than 4 letters also give away their last 2 letters when
  // `revealEndings` is on, in addition to the usual first-letter-of-each-
  // subword hint.
  const endingHintFrom =
    revealEndings && target.length > 4 ? target.length - 2 : Infinity;

  for (let i = 0; i < target.length; i++) {
    if (i < typed.length) {
      parts.push({ char: typed[i], kind: "typed" });
      continue;
    }

    const char = target[i];
    if (!isLetter(char)) {
      parts.push({ char, kind: "punctuation" });
    } else if (
      fullyRevealed ||
      !isLetter(target[i - 1]) ||
      i >= endingHintFrom
    ) {
      parts.push({ char, kind: "hintLetter" });
    } else {
      parts.push({ char: "●", kind: "mask" });
    }
  }

  if (typed.length > target.length) {
    for (const char of typed.slice(target.length)) {
      parts.push({ char, kind: "typed" });
    }
  }

  return parts;
}

/**
 * Whether every character already typed matches the target word so far
 * (case-insensitive) — true for an empty `typed`, false as soon as one
 * typed character is wrong, regardless of how much is left to type.
 */
export function isCorrectPrefix(target: string, typed: string): boolean {
  for (let i = 0; i < typed.length; i++) {
    if (typed[i].toLowerCase() !== target[i]?.toLowerCase()) return false;
  }
  return true;
}

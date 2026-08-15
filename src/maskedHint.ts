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
): MaskedHintPart[] {
  const parts: MaskedHintPart[] = [];

  for (let i = 0; i < target.length; i++) {
    if (i < typed.length) {
      parts.push({ char: typed[i], kind: "typed" });
      continue;
    }

    const char = target[i];
    if (!isLetter(char)) {
      parts.push({ char, kind: "punctuation" });
    } else if (!isLetter(target[i - 1])) {
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

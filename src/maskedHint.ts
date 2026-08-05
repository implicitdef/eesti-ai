export type MaskedHintPart = {
  char: string;
  kind: "typed" | "hintLetter" | "punctuation" | "mask";
};

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

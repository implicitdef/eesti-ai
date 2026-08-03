import * as Diff from "diff";

function stripTrailingPunctuation(s: string): string {
  return s.trim().replace(/[.!?]+$/, "");
}

export function computeDiff(expected: string, actual: string): Diff.Change[] {
  return Diff.diffChars(
    stripTrailingPunctuation(expected),
    stripTrailingPunctuation(actual),
    { ignoreCase: true },
  );
}

export function isExactMatch(expected: string, actual: string): boolean {
  return computeDiff(expected, actual).every(
    (part) => !part.added && !part.removed,
  );
}

import { useRef } from "react";
import {
  buildMaskedHintParts,
  isCorrectPrefix,
  type SentenceToken,
} from "./maskedHint";
import { playRevealSound } from "./sound";

function maskedHintPartClassName(
  kind: "typed" | "hintLetter" | "punctuation" | "mask",
) {
  switch (kind) {
    case "typed":
      return "text-gray-900";
    case "mask":
      return "text-gray-300";
    default:
      return "text-gray-400";
  }
}

function WordInput({
  word,
  value,
  revealEndings,
  revealed,
  onChange,
  onFilled,
  onFocusPrev,
  onReveal,
  inputRef,
}: {
  word: string;
  value: string;
  revealEndings: boolean;
  revealed: boolean;
  onChange: (value: string) => void;
  onFilled: () => void;
  onFocusPrev: () => void;
  onReveal: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
}) {
  const parts = buildMaskedHintParts(word, value, revealEndings, revealed);
  const isComposingRef = useRef(false);
  return (
    <span
      className="relative inline-block align-middle font-mono text-sm tracking-wide"
      style={{ width: `calc(${word.length}ch + 0.75rem)` }}
    >
      <span
        aria-hidden
        className="absolute inset-0 flex items-center px-1.5 text-sm font-mono tracking-wide pointer-events-none overflow-hidden whitespace-pre"
      >
        {parts.map((part, i) => (
          <span key={i} className={maskedHintPartClassName(part.kind)}>
            {part.char}
          </span>
        ))}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        maxLength={word.length}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          isComposingRef.current = false;
          const next = e.currentTarget.value;
          onChange(next);
          if (next.length >= word.length) onFilled();
        }}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          if (
            isComposingRef.current ||
            (e.nativeEvent as InputEvent).isComposing
          )
            return;
          if (next.length >= word.length) onFilled();
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && value === "") {
            e.preventDefault();
            onFocusPrev();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (!isCorrectPrefix(word, value)) onChange("");
            onReveal();
            playRevealSound();
          }
        }}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="relative w-full border border-gray-300 rounded-lg px-1.5 py-2.5 text-sm font-mono tracking-wide bg-transparent text-transparent caret-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </span>
  );
}

/**
 * Renders `tokens` as plain text for separators and a masked `WordInput` for
 * each word, giving away each word's first letter and length (dots for the
 * rest) exactly like the translation exercise's typing hints.
 */
function MaskedSentenceInputs({
  tokens,
  wordValues,
  revealEndings = false,
  revealedIndices,
  onChangeWord,
  registerInputRef,
  onFocusWord,
  onRevealWord,
}: {
  tokens: SentenceToken[];
  wordValues: string[];
  revealEndings?: boolean;
  revealedIndices: Set<number>;
  onChangeWord: (index: number, value: string) => void;
  registerInputRef: (index: number, el: HTMLInputElement | null) => void;
  onFocusWord: (index: number) => void;
  onRevealWord: (index: number) => void;
}) {
  let wordIndex = -1;

  return (
    <div className="flex flex-wrap items-center gap-y-2">
      {tokens.map((token, i) => {
        if (token.type === "separator") {
          return (
            <span
              key={i}
              className="text-sm font-mono tracking-wide text-gray-400 whitespace-pre"
            >
              {token.text}
            </span>
          );
        }
        wordIndex++;
        const index = wordIndex;
        return (
          <WordInput
            key={i}
            word={token.text}
            value={wordValues[index] ?? ""}
            revealEndings={revealEndings}
            revealed={revealedIndices.has(index)}
            onChange={(value) => onChangeWord(index, value)}
            onFilled={() => onFocusWord(index + 1)}
            onFocusPrev={() => onFocusWord(index - 1)}
            onReveal={() => onRevealWord(index)}
            inputRef={(el) => registerInputRef(index, el)}
          />
        );
      })}
    </div>
  );
}

export default MaskedSentenceInputs;

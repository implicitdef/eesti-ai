import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildMaskedHintParts,
  joinTokensWithWordValues,
  tokenizeSentence,
  wordTokenTexts,
  type SentenceToken,
} from "./maskedHint";
import type { SentencePracticeAttempt } from "./types";

interface Props {
  header: React.ReactNode;
  englishToTranslate: string;
  targetEstonian: string;
  attempts: SentencePracticeAttempt[];
  status: "in_progress" | "completed";
  revealed: boolean;
  onSubmitAttempt: (userAnswer: string) => void;
  onShowAnswer: () => void;
  onHideAnswer: () => void;
}

function CharComparison({
  expected,
  actual,
}: {
  expected: string;
  actual: string;
}) {
  return (
    <span className="font-mono text-sm tracking-wide">
      {actual.split("").map((char, i) => {
        const isMatch = char.toLowerCase() === expected[i]?.toLowerCase();
        return (
          <span key={i} className={isMatch ? "text-green-600" : "text-red-500"}>
            {char}
          </span>
        );
      })}
    </span>
  );
}

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
  onChange,
  onFilled,
  onFocusPrev,
  inputRef,
}: {
  word: string;
  value: string;
  onChange: (value: string) => void;
  onFilled: () => void;
  onFocusPrev: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
}) {
  const parts = buildMaskedHintParts(word, value);
  return (
    <span
      className="relative inline-block align-middle font-mono text-sm tracking-wide"
      style={{ width: `calc(${word.length}ch + 0.375rem)` }}
    >
      <span
        aria-hidden
        className="absolute inset-0 flex items-center px-0.5 text-sm font-mono tracking-wide pointer-events-none overflow-hidden whitespace-pre"
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
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          if (next.length >= word.length) onFilled();
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && value === "") {
            e.preventDefault();
            onFocusPrev();
          }
        }}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="relative w-full border border-gray-300 rounded-lg px-0.5 py-2.5 text-sm font-mono tracking-wide bg-transparent text-transparent caret-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </span>
  );
}

function MaskedSentenceInputs({
  tokens,
  wordValues,
  onChangeWord,
  registerInputRef,
  onFocusWord,
}: {
  tokens: SentenceToken[];
  wordValues: string[];
  onChangeWord: (index: number, value: string) => void;
  registerInputRef: (index: number, el: HTMLInputElement | null) => void;
  onFocusWord: (index: number) => void;
}) {
  let wordIndex = -1;

  return (
    <div className="flex-1 flex flex-wrap items-center gap-y-2">
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
            onChange={(value) => onChangeWord(index, value)}
            onFilled={() => onFocusWord(index + 1)}
            onFocusPrev={() => onFocusWord(index - 1)}
            inputRef={(el) => registerInputRef(index, el)}
          />
        );
      })}
    </div>
  );
}

function TranslationExerciseView({
  header,
  englishToTranslate,
  targetEstonian,
  attempts,
  status,
  revealed,
  onSubmitAttempt,
  onShowAnswer,
  onHideAnswer,
}: Props) {
  const tokens = useMemo(
    () => tokenizeSentence(targetEstonian),
    [targetEstonian],
  );
  const wordTexts = useMemo(() => wordTokenTexts(tokens), [tokens]);
  const [wordValues, setWordValues] = useState<string[]>(() =>
    wordTexts.map(() => ""),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setWordValues(wordTexts.map(() => ""));
  }, [targetEstonian]); // eslint-disable-line react-hooks/exhaustive-deps

  function registerInputRef(index: number, el: HTMLInputElement | null) {
    inputRefs.current[index] = el;
  }

  function focusWord(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "completed") return;
    const hasContent = wordValues.some((value) => value.trim().length > 0);
    if (!hasContent) return;

    onSubmitAttempt(joinTokensWithWordValues(tokens, wordValues).trim());

    const nextValues = wordValues.map((value, i) =>
      value.toLowerCase() === wordTexts[i]?.toLowerCase() ? value : "",
    );
    setWordValues(nextValues);
    const firstBlank = nextValues.findIndex((value) => value === "");
    if (firstBlank !== -1) focusWord(firstBlank);
  }

  const isCompleted = status === "completed";
  const lastAttempt = attempts[attempts.length - 1];
  const succeededOnLastAttempt = isCompleted && lastAttempt?.isCorrect === true;

  return (
    <div className="flex flex-col gap-8">
      {header}

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
          Translate to Estonian
        </p>
        <p className="text-2xl font-bold text-gray-900">{englishToTranslate}</p>
      </div>

      {attempts.length > 0 && (
        <div className="flex flex-col gap-4">
          {attempts.map((attempt, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Attempt {i + 1}
                </span>
              </div>
              <CharComparison
                expected={targetEstonian}
                actual={attempt.userAnswer}
              />
              {attempt.isCorrect && (
                <>
                  <p className="text-sm text-green-600 font-semibold">
                    ✓ Correct!
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {succeededOnLastAttempt && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <p className="text-green-700 font-semibold">
            Well done! Your translation is correct.
          </p>
        </div>
      )}

      {revealed && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Correct answer
            </p>
            <button
              onClick={onHideAnswer}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              Hide
            </button>
          </div>
          <p className="font-bold text-gray-900">{targetEstonian}</p>
        </div>
      )}

      {!isCompleted && (
        <div className="flex flex-col gap-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-start gap-3"
          >
            <MaskedSentenceInputs
              tokens={tokens}
              wordValues={wordValues}
              onChangeWord={(index, value) =>
                setWordValues((prev) =>
                  prev.map((v, i) => (i === index ? value : v)),
                )
              }
              registerInputRef={registerInputRef}
              onFocusWord={focusWord}
            />
            <button
              type="submit"
              disabled={!wordValues.some((value) => value.trim())}
              className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
            >
              Check
            </button>
          </form>
          <button
            onClick={onShowAnswer}
            className="self-start text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Show me the correct answer
          </button>
        </div>
      )}
    </div>
  );
}

export default TranslationExerciseView;

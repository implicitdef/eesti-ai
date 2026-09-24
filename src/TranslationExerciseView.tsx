import { useEffect, useMemo, useRef, useState } from "react";
import MaskedSentenceInputs from "./MaskedWordInputs";
import {
  joinTokensWithWordValues,
  tokenizeSentence,
  wordTokenTexts,
} from "./maskedHint";
import { solvedSentences, type SentencePair } from "./sentenceSplit";
import SettingsBox from "./SettingsBox";
import type { SentencePracticeAttempt } from "./types";
import { usePersistedState } from "./usePersistedState";

const REVEAL_ENDINGS_KEY = "eesti-ai-translation-reveal-endings";

interface Props {
  header: React.ReactNode;
  englishToTranslate: string;
  targetEstonian: string;
  attempts: SentencePracticeAttempt[];
  // Set for long texts, which are practised sentence by sentence.
  sentencePairs: SentencePair[] | null;
  status: "in_progress" | "completed";
  hideTheme: boolean;
  onHideThemeChange: (hideTheme: boolean) => void;
  onSubmitAttempt: (
    userAnswer: string,
    wordValues: string[],
    sentenceIndex?: number,
  ) => void;
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

function WordDiff({ expected, actual }: { expected: string; actual: string }) {
  const length = Math.max(expected.length, actual.length);
  const chars: React.ReactNode[] = [];
  for (let i = 0; i < length; i++) {
    if (i < actual.length) {
      const isMatch = actual[i].toLowerCase() === expected[i]?.toLowerCase();
      chars.push(
        <span key={i} className={isMatch ? "text-green-600" : "text-red-500"}>
          {actual[i]}
        </span>,
      );
    } else {
      chars.push(
        <span key={i} className="text-red-500">
          _
        </span>,
      );
    }
  }
  return <>{chars}</>;
}

function AttemptDiff({
  targetEstonian,
  attempt,
}: {
  targetEstonian: string;
  attempt: SentencePracticeAttempt;
}) {
  const tokens = useMemo(
    () => tokenizeSentence(targetEstonian),
    [targetEstonian],
  );
  const wordTexts = useMemo(() => wordTokenTexts(tokens), [tokens]);

  // Attempts recorded before per-word inputs existed don't have wordValues;
  // fall back to the old whole-string comparison for those.
  if (!attempt.wordValues) {
    return (
      <CharComparison expected={targetEstonian} actual={attempt.userAnswer} />
    );
  }

  let wordIndex = -1;
  return (
    <span className="font-mono text-sm tracking-wide">
      {tokens.map((token, i) => {
        if (token.type === "separator") {
          return (
            <span key={i} className="text-gray-500">
              {token.text}
            </span>
          );
        }
        wordIndex++;
        const idx = wordIndex;
        return (
          <WordDiff
            key={i}
            expected={wordTexts[idx]}
            actual={attempt.wordValues?.[idx] ?? ""}
          />
        );
      })}
    </span>
  );
}

/** The masked word inputs, Check button and tip for one Estonian sentence. */
function SentenceExercise({
  targetEstonian,
  revealEndings,
  autoFocus,
  onSubmitAttempt,
}: {
  targetEstonian: string;
  revealEndings: boolean;
  autoFocus: boolean;
  onSubmitAttempt: (userAnswer: string, wordValues: string[]) => void;
}) {
  const tokens = useMemo(
    () => tokenizeSentence(targetEstonian),
    [targetEstonian],
  );
  const wordTexts = useMemo(() => wordTokenTexts(tokens), [tokens]);
  const [wordValues, setWordValues] = useState<string[]>(() =>
    wordTexts.map(() => ""),
  );
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setWordValues(wordTexts.map(() => ""));
    setRevealedIndices(new Set());
  }, [targetEstonian]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoFocus) focusWord(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function registerInputRef(index: number, el: HTMLInputElement | null) {
    inputRefs.current[index] = el;
  }

  function focusWord(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function revealWord(index: number) {
    setRevealedIndices((prev) => new Set(prev).add(index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hasContent = wordValues.some((value) => value.trim().length > 0);
    if (!hasContent) return;

    onSubmitAttempt(
      joinTokensWithWordValues(tokens, wordValues).trim(),
      wordValues,
    );

    const nextValues = wordValues.map((value, i) =>
      value.toLowerCase() === wordTexts[i]?.toLowerCase() ? value : "",
    );
    setWordValues(nextValues);
    const firstBlank = nextValues.findIndex((value) => value === "");
    if (firstBlank !== -1) focusWord(firstBlank);
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-start gap-3"
      >
        <MaskedSentenceInputs
          tokens={tokens}
          wordValues={wordValues}
          revealEndings={revealEndings}
          revealedIndices={revealedIndices}
          onChangeWord={(index, value) =>
            setWordValues((prev) =>
              prev.map((v, i) => (i === index ? value : v)),
            )
          }
          registerInputRef={registerInputRef}
          onFocusWord={focusWord}
          onRevealWord={revealWord}
        />
        <button
          type="submit"
          disabled={!wordValues.some((value) => value.trim())}
          className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
        >
          Check
        </button>
      </form>
      <p className="text-xs text-gray-400">
        Tip: press Ctrl+Enter (Cmd+Enter on Mac) while in a word to reveal it.
      </p>
    </div>
  );
}

function LongTextExercise({
  sentencePairs,
  attempts,
  isCompleted,
  revealEndings,
  onSubmitAttempt,
}: {
  sentencePairs: SentencePair[];
  attempts: SentencePracticeAttempt[];
  isCompleted: boolean;
  revealEndings: boolean;
  onSubmitAttempt: Props["onSubmitAttempt"];
}) {
  const solved = solvedSentences(sentencePairs, attempts, isCompleted);
  const currentIndex = solved.indexOf(false);
  // Only move focus when the user progresses to a new sentence, not when
  // the page first opens.
  const initialIndexRef = useRef(currentIndex);

  return (
    <div className="flex flex-col gap-8">
      {sentencePairs.map((pair, i) => {
        if (solved[i]) {
          return (
            <div key={i} className="flex flex-col gap-1">
              <p className="text-2xl font-bold text-gray-900">{pair.english}</p>
              <p className="font-mono text-sm tracking-wide text-green-600">
                ✓ {pair.estonian}
              </p>
            </div>
          );
        }
        if (i !== currentIndex) {
          return (
            <p key={i} className="text-2xl font-bold text-gray-400">
              {pair.english}
            </p>
          );
        }
        const sentenceAttempts = attempts.filter((a) => a.sentenceIndex === i);
        const lastAttempt = sentenceAttempts[sentenceAttempts.length - 1];
        return (
          <div key={i} className="flex flex-col gap-4">
            <p className="text-2xl font-bold text-gray-900">{pair.english}</p>
            {lastAttempt && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Your last attempt
                </span>
                <AttemptDiff
                  targetEstonian={pair.estonian}
                  attempt={lastAttempt}
                />
              </div>
            )}
            <SentenceExercise
              targetEstonian={pair.estonian}
              revealEndings={revealEndings}
              autoFocus={i !== initialIndexRef.current}
              onSubmitAttempt={(userAnswer, wordValues) =>
                onSubmitAttempt(userAnswer, wordValues, i)
              }
            />
          </div>
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
  sentencePairs,
  status,
  hideTheme,
  onHideThemeChange,
  onSubmitAttempt,
}: Props) {
  const [revealEndings, setRevealEndings] = usePersistedState(
    REVEAL_ENDINGS_KEY,
    false,
  );

  const isCompleted = status === "completed";
  const lastAttempt = attempts[attempts.length - 1];
  const succeededOnLastAttempt = isCompleted && lastAttempt?.isCorrect === true;

  return (
    <div className="flex flex-col gap-8">
      {header}
      <SettingsBox title="Translation settings" stacked>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={revealEndings}
            onChange={(e) => setRevealEndings(e.target.checked)}
            className="h-4 w-4 accent-blue-700"
          />
          Also reveal the word endings (for words of 5+ letters)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={hideTheme}
            onChange={(e) => onHideThemeChange(e.target.checked)}
            className="h-4 w-4 accent-blue-700"
          />
          Hide the theme
        </label>
      </SettingsBox>
      {sentencePairs && (
        <p className="text-xs text-gray-500 -mb-4">This is a long text</p>
      )}

      {sentencePairs ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
            Translate to Estonian
          </p>
          <LongTextExercise
            sentencePairs={sentencePairs}
            attempts={attempts}
            isCompleted={isCompleted}
            revealEndings={revealEndings}
            onSubmitAttempt={onSubmitAttempt}
          />
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              Translate to Estonian
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {englishToTranslate}
            </p>
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
                  <AttemptDiff
                    targetEstonian={targetEstonian}
                    attempt={attempt}
                  />
                  {attempt.isCorrect && (
                    <p className="text-sm text-green-600 font-semibold">
                      ✓ Correct!
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {succeededOnLastAttempt && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <p className="text-green-700 font-semibold">
            Well done! Your translation is correct.
          </p>
        </div>
      )}

      {!isCompleted && !sentencePairs && (
        <SentenceExercise
          targetEstonian={targetEstonian}
          revealEndings={revealEndings}
          autoFocus={false}
          onSubmitAttempt={(userAnswer, wordValues) =>
            onSubmitAttempt(userAnswer, wordValues)
          }
        />
      )}
    </div>
  );
}

export default TranslationExerciseView;

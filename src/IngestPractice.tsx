import { useEffect, useMemo, useRef, useState } from "react";
import { isExactMatch } from "./estonianDiff";
import {
  joinTokensWithWordValues,
  tokenizeSentence,
  wordTokenTexts,
} from "./maskedHint";
import MaskedSentenceInputs from "./MaskedWordInputs";
import { playCorrectSound, playIncorrectSound } from "./sound";
import {
  buildOptions,
  optionCountForDifficulty,
  shuffleOrder,
  type Difficulty,
} from "./vocabIngest";
import type { VocabPair } from "./types";

interface Props {
  // The words asked this session, in caller-defined order (index-aligned
  // with the `correctness` array passed to onComplete).
  quizPairs: VocabPair[];
  // Pool to draw wrong-answer options from — the whole deck, even when only
  // a subset of it (e.g. previously missed words) is being quizzed.
  optionPool: VocabPair[];
  // When true, the English translation is shown and the Estonian word must
  // be guessed instead of the other way around.
  reversed: boolean;
  difficulty: Difficulty;
  onExit: () => void;
  // Called immediately as each word's result becomes known — on the first
  // wrong attempt (correct: false) and again once the word is finally
  // answered right (correct: true only if it was never missed) — so
  // progress survives leaving mid-session. `pairIndex` indexes `quizPairs`.
  onAnswer: (pairIndex: number, correct: boolean) => void;
  onComplete: () => void;
}

function optionClassName(
  option: string,
  wrongOptions: Set<string>,
  answeredCorrectly: boolean,
  correct: string,
) {
  if (answeredCorrectly && option === correct) {
    return "border-green-500 bg-green-50 text-green-700";
  }
  if (wrongOptions.has(option)) {
    return "border-red-400 bg-red-50 text-red-600";
  }
  if (answeredCorrectly) {
    return "border-gray-200 text-gray-400";
  }
  return "border-gray-300 hover:border-blue-400 hover:bg-blue-50";
}

function MultipleChoiceStep({
  correct,
  optionPool,
  field,
  optionCount,
  onCorrect,
  onWrongAttempt,
}: {
  correct: string;
  optionPool: VocabPair[];
  field: "estonian" | "english";
  optionCount: number;
  onCorrect: (isFirstTry: boolean) => void;
  onWrongAttempt: () => void;
}) {
  const [wrongOptions, setWrongOptions] = useState<Set<string>>(new Set());
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const options = useMemo(
    () => buildOptions(correct, optionPool, field, optionCount),
    [correct, optionPool, field, optionCount],
  );

  function handleSelect(option: string) {
    if (answeredCorrectly || wrongOptions.has(option)) return;
    if (option.toLowerCase() === correct.toLowerCase()) {
      setAnsweredCorrectly(true);
      const isFirstTry = wrongOptions.size === 0;
      playCorrectSound();
      onCorrect(isFirstTry);
    } else {
      if (wrongOptions.size === 0) onWrongAttempt();
      setWrongOptions((prev) => new Set(prev).add(option));
      playIncorrectSound();
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => handleSelect(option)}
          disabled={answeredCorrectly || wrongOptions.has(option)}
          className={`border rounded-lg px-4 py-2.5 text-sm text-left transition-colors disabled:cursor-default ${optionClassName(option, wrongOptions, answeredCorrectly, correct)}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function TypedAnswerStep({
  correct,
  onCorrect,
  onWrongAttempt,
}: {
  correct: string;
  onCorrect: (isFirstTry: boolean) => void;
  onWrongAttempt: () => void;
}) {
  const tokens = useMemo(() => tokenizeSentence(correct), [correct]);
  const wordTexts = useMemo(() => wordTokenTexts(tokens), [tokens]);
  const [wordValues, setWordValues] = useState<string[]>(() =>
    wordTexts.map(() => ""),
  );
  const [hasErrored, setHasErrored] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function registerInputRef(index: number, el: HTMLInputElement | null) {
    inputRefs.current[index] = el;
  }

  function focusWord(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answeredCorrectly) return;
    const hasContent = wordValues.some((value) => value.trim().length > 0);
    if (!hasContent) return;

    const attempt = joinTokensWithWordValues(tokens, wordValues).trim();
    if (isExactMatch(correct, attempt)) {
      setAnsweredCorrectly(true);
      playCorrectSound();
      onCorrect(!hasErrored);
      return;
    }

    if (!hasErrored) onWrongAttempt();
    setHasErrored(true);
    playIncorrectSound();
    const nextValues = wordValues.map((value, i) =>
      value.toLowerCase() === wordTexts[i]?.toLowerCase() ? value : "",
    );
    setWordValues(nextValues);
    const firstBlank = nextValues.findIndex((value) => value === "");
    if (firstBlank !== -1) focusWord(firstBlank);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <MaskedSentenceInputs
        tokens={tokens}
        wordValues={wordValues}
        onChangeWord={(index, value) =>
          setWordValues((prev) => prev.map((v, i) => (i === index ? value : v)))
        }
        registerInputRef={registerInputRef}
        onFocusWord={focusWord}
      />
      <button
        type="submit"
        disabled={answeredCorrectly || !wordValues.some((v) => v.trim())}
        className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
      >
        Check
      </button>
    </form>
  );
}

function IngestPractice({
  quizPairs,
  optionPool,
  reversed,
  difficulty,
  onExit,
  onAnswer,
  onComplete,
}: Props) {
  const [order] = useState(() => shuffleOrder(quizPairs.length));
  const [step, setStep] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [advancePending, setAdvancePending] = useState(false);

  const pairIndex = order[step];
  const current = quizPairs[pairIndex];
  const prompt = reversed ? current.english : current.estonian;
  const correct = reversed ? current.estonian : current.english;
  const isLast = step === order.length - 1;

  function handleAnswer(isCorrect: boolean) {
    onAnswer(pairIndex, isCorrect);
  }

  function handleCorrect(isFirstTry: boolean) {
    handleAnswer(isFirstTry);
    if (isFirstTry) setCorrectCount((c) => c + 1);
    setAdvancePending(true);
  }

  useEffect(() => {
    if (!advancePending) return;
    const timer = setTimeout(() => {
      if (isLast) {
        onComplete();
        return;
      }
      setStep((s) => s + 1);
      setAdvancePending(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [advancePending, isLast, onComplete]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Stop practicing
        </button>
        <span className="text-xs text-gray-500">
          Word {step + 1} of {order.length} · {correctCount} correct
        </span>
      </div>

      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
          {reversed
            ? "How do you say this in Estonian?"
            : "What does this mean?"}
        </p>
        <p className="text-3xl font-bold text-gray-900">{prompt}</p>
      </div>

      {difficulty === "hard" ? (
        <TypedAnswerStep
          key={step}
          correct={correct}
          onCorrect={handleCorrect}
          onWrongAttempt={() => handleAnswer(false)}
        />
      ) : (
        <MultipleChoiceStep
          key={step}
          correct={correct}
          optionPool={optionPool}
          onWrongAttempt={() => handleAnswer(false)}
          field={reversed ? "estonian" : "english"}
          optionCount={optionCountForDifficulty(difficulty)}
          onCorrect={handleCorrect}
        />
      )}
    </div>
  );
}

export default IngestPractice;

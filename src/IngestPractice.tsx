import { useEffect, useMemo, useState } from "react";
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

      <MultipleChoiceStep
        key={step}
        correct={correct}
        optionPool={optionPool}
        onWrongAttempt={() => handleAnswer(false)}
        field={reversed ? "estonian" : "english"}
        optionCount={optionCountForDifficulty(difficulty)}
        onCorrect={handleCorrect}
      />
    </div>
  );
}

export default IngestPractice;

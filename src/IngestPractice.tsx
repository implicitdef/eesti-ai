import { useMemo, useRef, useState } from "react";
import { buildOptions, shuffleOrder } from "./vocabIngest";
import type { VocabPair } from "./types";

interface Props {
  // The words asked this session, in caller-defined order (index-aligned
  // with the `correctness` array passed to onComplete).
  quizPairs: VocabPair[];
  // Pool to draw wrong-answer options from — the whole deck, even when only
  // a subset of it (e.g. previously missed words) is being quizzed.
  optionPool: VocabPair[];
  onExit: () => void;
  onComplete: (correctness: boolean[]) => void;
}

function optionClassName(
  option: string,
  selected: string | null,
  correct: string,
) {
  if (selected === null) {
    return "border-gray-300 hover:border-blue-400 hover:bg-blue-50";
  }
  if (option === correct) {
    return "border-green-500 bg-green-50 text-green-700";
  }
  if (option === selected) {
    return "border-red-400 bg-red-50 text-red-600";
  }
  return "border-gray-200 text-gray-400";
}

function IngestPractice({ quizPairs, optionPool, onExit, onComplete }: Props) {
  const [order] = useState(() => shuffleOrder(quizPairs.length));
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const resultsRef = useRef<boolean[]>(new Array(quizPairs.length).fill(false));

  const pairIndex = order[step];
  const current = quizPairs[pairIndex];
  const options = useMemo(
    () => buildOptions(current.english, optionPool),
    [current, optionPool],
  );
  const isLast = step === order.length - 1;

  function handleSelect(option: string) {
    if (selected !== null) return;
    setSelected(option);
    const isCorrect = option.toLowerCase() === current.english.toLowerCase();
    resultsRef.current[pairIndex] = isCorrect;
    if (isCorrect) setCorrectCount((c) => c + 1);
  }

  function handleNext() {
    if (isLast) {
      onComplete(resultsRef.current);
      return;
    }
    setStep((s) => s + 1);
    setSelected(null);
  }

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
          What does this mean?
        </p>
        <p className="text-3xl font-bold text-gray-900">{current.estonian}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={selected !== null}
            className={`border rounded-lg px-4 py-2.5 text-sm text-left transition-colors disabled:cursor-default ${optionClassName(option, selected, current.english)}`}
          >
            {option}
          </button>
        ))}
      </div>

      {selected !== null && (
        <button
          onClick={handleNext}
          className="self-center bg-blue-700 text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          {isLast ? "Finish" : "Next word"}
        </button>
      )}
    </div>
  );
}

export default IngestPractice;

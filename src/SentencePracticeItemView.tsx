import { useState } from "react";
import { computeDiff } from "./estonianDiff";
import type { SentencePracticeItem } from "./types";

interface Props {
  item: SentencePracticeItem;
  onSubmitAttempt: (userAnswer: string) => void;
  onShowAnswer: () => void;
  onGenerateNewVariant: () => void | Promise<void>;
  generatingNewVariant: boolean;
}

function DiffText({
  expected,
  actual,
  revealExact,
}: {
  expected: string;
  actual: string;
  revealExact: boolean;
}) {
  const parts = computeDiff(expected, actual);
  return (
    <span className="font-mono text-sm tracking-wide">
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} className="text-red-500">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} className="text-amber-600">
              {revealExact ? (
                <span className="line-through decoration-2">{part.value}</span>
              ) : (
                "•".repeat(part.value.length)
              )}
            </span>
          );
        }
        return (
          <span key={i} className="text-green-600">
            {part.value}
          </span>
        );
      })}
    </span>
  );
}

function SentencePracticeItemView({
  item,
  onSubmitAttempt,
  onShowAnswer,
  onGenerateNewVariant,
  generatingNewVariant,
}: Props) {
  const [input, setInput] = useState("");
  const [revealExact, setRevealExact] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || item.status === "completed") return;
    onSubmitAttempt(text);
    setInput("");
  }

  const isCompleted = item.status === "completed";
  const lastAttempt = item.attempts[item.attempts.length - 1];
  const succeededOnLastAttempt = isCompleted && lastAttempt?.isCorrect === true;
  const hasMistakesToReveal = item.attempts.some((a) => !a.isCorrect);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">
          Original: {item.originalEstonian}
        </span>
        <button
          onClick={onGenerateNewVariant}
          disabled={generatingNewVariant}
          className="text-xs text-gray-400 hover:text-blue-600 underline transition-colors disabled:opacity-40"
        >
          {generatingNewVariant ? "Generating…" : "New variant →"}
        </button>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-2">{item.englishTranslation}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
          Translate to Estonian
        </p>
        <p className="text-2xl font-bold text-gray-900">
          {item.variantEnglishTranslation}
        </p>
      </div>

      {item.attempts.length > 0 && (
        <div className="flex flex-col gap-4">
          {item.attempts.map((attempt, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Attempt {i + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {attempt.userAnswer}
                </span>
              </div>
              {attempt.isCorrect ? (
                <p className="text-sm text-green-600 font-semibold">
                  ✓ Correct!
                </p>
              ) : (
                <DiffText
                  expected={item.variant}
                  actual={attempt.userAnswer}
                  revealExact={revealExact}
                />
              )}
            </div>
          ))}
          {hasMistakesToReveal && (
            <button
              onClick={() => setRevealExact((v) => !v)}
              className="self-start text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              {revealExact
                ? "Hide exact corrections"
                : "Reveal exact corrections"}
            </button>
          )}
        </div>
      )}

      {succeededOnLastAttempt && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <p className="text-green-700 font-semibold">
            Well done! Your translation is correct.
          </p>
        </div>
      )}

      {item.revealed && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Correct answer
          </p>
          <p className="font-bold text-gray-900">{item.variant}</p>
        </div>
      )}

      {!isCompleted && (
        <div className="flex flex-col gap-3">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your Estonian translation…"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
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

export default SentencePracticeItemView;

import { useState } from "react";
import type { PracticeConversation } from "./types";

interface Props {
  conversation: PracticeConversation;
  onSubmitAttempt: (translation: string) => Promise<void>;
  onShowAnswer: () => Promise<void>;
  loading: boolean;
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? "text-green-600" : "text-red-500"}>
      {ok ? "✓" : "✗"}
    </span>
  );
}

function PracticeConversationView({
  conversation,
  onSubmitAttempt,
  onShowAnswer,
  loading,
}: Props) {
  const [input, setInput] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    await onSubmitAttempt(text);
    setInput("");
  }

  const isCompleted = conversation.status === "completed";
  const lastAttempt = conversation.attempts[conversation.attempts.length - 1];
  const succeededOnLastAttempt = isCompleted && lastAttempt?.isCorrect === true;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
          Translate to Estonian
        </p>
        <p className="text-2xl font-bold text-gray-900">
          {conversation.englishSentence}
        </p>
      </div>

      {conversation.attempts.length > 0 && (
        <div className="flex flex-col gap-6">
          {conversation.attempts.map((attempt, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Attempt {i + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {attempt.userTranslation}
                </span>
              </div>

              {attempt.isCorrect ? (
                <p className="text-sm text-green-600 font-semibold">
                  ✓ Correct!
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-4 text-sm">
                    <span>
                      <Check ok={attempt.isUnderstandable} /> Understandable
                    </span>
                    <span>
                      <Check ok={attempt.isGrammaticallyCorrect} /> Grammar
                    </span>
                    <span>
                      <Check ok={attempt.isNatural} /> Natural
                    </span>
                  </div>
                  {attempt.mistakes.length > 0 && (
                    <ul className="flex flex-col gap-1 mt-1">
                      {attempt.mistakes.map((m, j) => (
                        <li
                          key={j}
                          className="border-l-4 border-red-300 pl-3 text-sm"
                        >
                          <span className="text-gray-600">{m.issue}</span>
                          {" → "}
                          <span className="font-medium text-gray-900">
                            {m.suggestion}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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

      {conversation.correctVersions && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            {succeededOnLastAttempt
              ? "Other ways to say it"
              : "Correct versions"}
          </p>
          {conversation.correctVersions.map((v, i) => (
            <div
              key={i}
              className="border-l-4 border-blue-500 pl-4 py-1 flex flex-col gap-1"
            >
              <p className="font-bold text-gray-900">{v.translation}</p>
              <p className="text-sm text-gray-500">{v.commentary}</p>
            </div>
          ))}
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
              disabled={loading}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
            >
              {loading ? "Checking…" : "Submit"}
            </button>
          </form>
          <button
            onClick={onShowAnswer}
            disabled={loading}
            className="self-start text-xs text-gray-400 hover:text-gray-600 underline transition-colors disabled:opacity-40"
          >
            Show me the correct answer
          </button>
        </div>
      )}
    </div>
  );
}

export default PracticeConversationView;

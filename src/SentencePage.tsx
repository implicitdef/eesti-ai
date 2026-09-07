import { Link, useParams } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { useApiKey } from "./ApiKeyContext";
import BackToListLink from "./BackToListLink";
import { useFromTheme } from "./FromThemeContext";
import { isExactMatch } from "./estonianDiff";
import GenerateAnotherButton from "./GenerateAnotherButton";
import PageMain from "./PageMain";
import { playCorrectSound, playIncorrectSound } from "./sound";
import ThemeLabel, { formatThemeLevel } from "./ThemeLabel";
import TranslationExerciseView from "./TranslationExerciseView";
import type { SentenceLevel, ThemePracticeItem } from "./types";

function GeneratingDetailView({
  theme,
  level,
}: {
  theme: string;
  level: SentenceLevel;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ThemeLabel theme={theme} level={level} />
      <div className="flex items-center gap-2 text-gray-500">
        <RefreshCcw size={18} className="animate-spin" />
        <p className="text-sm">Generating sentence…</p>
      </div>
    </div>
  );
}

function GenerationErrorDetailView({
  theme,
  level,
  errorMessage,
  onRetry,
  spinning,
  disabled,
}: {
  theme: string;
  level: SentenceLevel;
  errorMessage: string | undefined;
  onRetry: () => void;
  spinning: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ThemeLabel theme={theme} level={level} />
      <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 flex flex-col gap-2">
        <p className="text-red-700 font-semibold text-sm">
          Couldn't generate a sentence for this theme.
        </p>
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
        <button
          onClick={onRetry}
          disabled={disabled}
          className={`self-start flex items-center gap-1.5 bg-blue-700 text-white rounded-md px-4 py-1.5 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:cursor-not-allowed ${spinning ? "btn-shimmer" : ""}`}
        >
          <RefreshCcw size={16} className={spinning ? "animate-spin" : ""} />
          {spinning ? "Retrying…" : "Retry"}
        </button>
      </div>
    </div>
  );
}

function SentenceNav({
  prev,
  next,
}: {
  prev: ThemePracticeItem | undefined;
  next: ThemePracticeItem | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
      {prev ? (
        <Link
          to="/sentence/$id"
          params={{ id: prev.id }}
          className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
        >
          ← Previous sentence: {formatThemeLevel(prev.theme, prev.level)}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          to="/sentence/$id"
          params={{ id: next.id }}
          className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline text-right"
        >
          Next sentence: {formatThemeLevel(next.theme, next.level)} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

function SentencePage() {
  const { id } = useParams({ from: "/fromThemeLayout/sentence/$id" });
  const { apiKey } = useApiKey();
  const {
    findItem,
    siblingsFor,
    generatingSource,
    isGenerating,
    generateAnother,
    retry,
    updateItem,
  } = useFromTheme();

  const item = findItem(id);

  if (!item) {
    return (
      <PageMain gap={4}>
        <BackToListLink />
        <p className="text-sm text-gray-500">Sentence not found.</p>
      </PageMain>
    );
  }

  const siblings = siblingsFor(id);
  const index = siblings.findIndex((it) => it.id === id);
  const prev = siblings[index + 1];
  const next = siblings[index - 1];
  const isDemo = item.id.startsWith("demo-");

  const handleSubmitAttempt = (userAnswer: string, wordValues: string[]) => {
    const isCorrect = isExactMatch(item.sentence, userAnswer);
    updateItem({
      ...item,
      attempts: [...item.attempts, { userAnswer, isCorrect, wordValues }],
      status: isCorrect ? "completed" : item.status,
    });
    if (isCorrect) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
  };

  const handleShowAnswer = () => {
    updateItem({ ...item, revealed: true, status: "completed" });
  };

  const handleHideAnswer = () => {
    updateItem({ ...item, revealed: false, status: "in_progress" });
  };

  return (
    <PageMain>
      <BackToListLink />

      {item.status === "generating" && (
        <GeneratingDetailView theme={item.theme} level={item.level} />
      )}
      {item.status === "error" && (
        <GenerationErrorDetailView
          theme={item.theme}
          level={item.level}
          errorMessage={item.errorMessage}
          onRetry={() => retry(item)}
          spinning={generatingSource === "retry"}
          disabled={isGenerating}
        />
      )}
      {(item.status === "in_progress" || item.status === "completed") && (
        <TranslationExerciseView
          header={
            <div className="flex flex-col gap-3">
              {isDemo && !apiKey && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 w-fit">
                  This is a pregenerated example. Generating your own sentences
                  needs an Anthropic API key.
                </p>
              )}
              <div className="flex flex-wrap items-end gap-3">
                <ThemeLabel theme={item.theme} level={item.level} />
                <GenerateAnotherButton
                  onClick={() => generateAnother(item)}
                  spinning={generatingSource === "another"}
                  disabled={isGenerating}
                />
                <Link
                  to="/generate"
                  className="text-xs text-gray-500 hover:text-blue-700 underline transition-colors self-center"
                >
                  Generate something different
                </Link>
              </div>
            </div>
          }
          targetEstonian={item.sentence}
          englishToTranslate={item.englishTranslation}
          attempts={item.attempts}
          status={item.status}
          revealed={item.revealed}
          onSubmitAttempt={handleSubmitAttempt}
          onShowAnswer={handleShowAnswer}
          onHideAnswer={handleHideAnswer}
        />
      )}

      <SentenceNav prev={prev} next={next} />
    </PageMain>
  );
}

export default SentencePage;

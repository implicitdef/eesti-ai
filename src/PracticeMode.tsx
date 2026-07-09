import { useEffect, useState } from "react";
import HistoryPanel from "./HistoryPanel";
import ModeToolbar from "./ModeToolbar";
import {
  evaluateTranslation,
  generateSentence,
  getCorrectVersions,
} from "./practice-api";
import PracticeConversationView from "./PracticeConversationView";
import SidebarLayout, { useCollapsibleSidebar } from "./SidebarLayout";
import type { PracticeConversation } from "./types";

const PRACTICE_HISTORY_KEY = "eesti-ai-practice-history";
const API_KEY_STORAGE = "eesti-ai-api-key";

function PracticeMode() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE)!;

  const [conversations, setConversations] = useState<PracticeConversation[]>(
    () => {
      try {
        const stored = localStorage.getItem(PRACTICE_HISTORY_KEY);
        return stored ? (JSON.parse(stored) as PracticeConversation[]) : [];
      } catch {
        return [];
      }
    },
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => conversations[0]?.id ?? null,
  );
  const [theme, setTheme] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, toggle, close } = useCollapsibleSidebar();

  useEffect(() => {
    localStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(conversations));
  }, [conversations]);

  function updateConversation(updated: PracticeConversation) {
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
  }

  async function generateWithTheme(themeStr: string) {
    if (!themeStr || loadingGenerate) return;
    setLoadingGenerate(true);
    setError(null);
    try {
      const previousSentences = conversations
        .filter((c) => c.theme.toLowerCase() === themeStr.toLowerCase())
        .map((c) => c.englishSentence);

      const sentence = await generateSentence(
        themeStr,
        previousSentences,
        apiKey,
      );
      const acceptedVersions = await getCorrectVersions(sentence, apiKey);
      const newConv: PracticeConversation = {
        id: crypto.randomUUID(),
        theme: themeStr,
        englishSentence: sentence,
        attempts: [],
        acceptedVersions,
        correctVersions: null,
        status: "in_progress",
        createdAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setSelectedId(newConv.id);
      setTheme("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generateWithTheme(theme.trim());
  }

  async function handleSubmitAttempt(translation: string) {
    const conv = conversations.find((c) => c.id === selectedId);
    if (!conv) return;
    setLoadingAction(true);
    setError(null);
    try {
      const result = await evaluateTranslation(
        conv.englishSentence,
        translation,
        conv.acceptedVersions ?? [],
        apiKey,
      );
      const attempt = { userTranslation: translation, ...result };
      updateConversation({
        ...conv,
        attempts: [...conv.attempts, attempt],
        status: result.isCorrect ? "completed" : "in_progress",
        correctVersions: result.isCorrect
          ? (conv.acceptedVersions ?? conv.correctVersions)
          : conv.correctVersions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleShowAnswer() {
    const conv = conversations.find((c) => c.id === selectedId);
    if (!conv) return;
    updateConversation({
      ...conv,
      correctVersions: conv.acceptedVersions,
      status: "completed",
    });
  }

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;
  const hasConversations = conversations.length > 0;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <ModeToolbar
        hasHistory={hasConversations}
        onToggleHistory={toggle}
        value={theme}
        onChange={setTheme}
        onSubmit={handleGenerate}
        placeholder="Enter a theme…"
        hint='e.g. "beach", "equal", "memory", "asking for water at the restaurant", "flirting at the gym", …'
        disabled={!theme.trim() || loadingGenerate}
        error={error}
        submitLabel={loadingGenerate ? "Generating…" : "New sentence"}
      />

      {hasConversations && (
        <SidebarLayout
          isOpen={isOpen}
          onClose={close}
          sidebar={
            <HistoryPanel
              items={conversations.map((c) => ({ id: c.id, label: c.theme }))}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                close();
              }}
              onClear={() => {
                setConversations([]);
                setSelectedId(null);
                close();
              }}
            />
          }
        >
          {selectedConv && (
            <PracticeConversationView
              conversation={selectedConv}
              onSubmitAttempt={handleSubmitAttempt}
              onShowAnswer={handleShowAnswer}
              onGenerateWithSameTheme={() =>
                generateWithTheme(selectedConv.theme)
              }
              loading={loadingAction}
              generatingNewSentence={loadingGenerate}
            />
          )}
        </SidebarLayout>
      )}
    </main>
  );
}

export default PracticeMode;

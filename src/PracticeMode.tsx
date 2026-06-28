import { useState, useEffect } from "react";
import type { PracticeConversation } from "./types";
import {
  generateSentence,
  evaluateTranslation,
  getCorrectVersions,
} from "./practice-api";
import HistoryPanel from "./HistoryPanel";
import ModeToolbar from "./ModeToolbar";
import SidebarLayout, { useCollapsibleSidebar } from "./SidebarLayout";
import PracticeConversationView from "./PracticeConversationView";

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

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = theme.trim();
    if (!trimmed || loadingGenerate) return;
    setLoadingGenerate(true);
    setError(null);
    try {
      const previousSentences = conversations
        .filter((c) => c.theme.toLowerCase() === trimmed.toLowerCase())
        .map((c) => c.englishSentence);

      const sentence = await generateSentence(
        trimmed,
        previousSentences,
        apiKey,
      );
      const newConv: PracticeConversation = {
        id: crypto.randomUUID(),
        theme: trimmed,
        englishSentence: sentence,
        attempts: [],
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

  async function handleSubmitAttempt(translation: string) {
    const conv = conversations.find((c) => c.id === selectedId);
    if (!conv) return;
    setLoadingAction(true);
    setError(null);
    try {
      const result = await evaluateTranslation(
        conv.englishSentence,
        translation,
        apiKey,
      );
      const attempt = { userTranslation: translation, ...result };
      updateConversation({
        ...conv,
        attempts: [...conv.attempts, attempt],
        status: result.isCorrect ? "completed" : "in_progress",
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
    setLoadingAction(true);
    setError(null);
    try {
      const versions = await getCorrectVersions(conv.englishSentence, apiKey);
      updateConversation({
        ...conv,
        correctVersions: versions,
        status: "completed",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingAction(false);
    }
  }

  const selectedConv =
    conversations.find((c) => c.id === selectedId) ?? null;
  const hasConversations = conversations.length > 0;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <ModeToolbar
        hasHistory={hasConversations}
        onToggleHistory={toggle}
        value={theme}
        onChange={setTheme}
        onSubmit={handleGenerate}
        placeholder="Enter a theme (e.g. fruits, work, flirting at the gym…)"
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
              loading={loadingAction}
            />
          )}
        </SidebarLayout>
      )}
    </main>
  );
}

export default PracticeMode;

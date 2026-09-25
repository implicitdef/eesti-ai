import { Check, Copy, RefreshCcw } from "lucide-react";
import { useState } from "react";
import ApiKeyModal from "./ApiKeyModal";
import { useApiKey } from "./CredentialsContext";
import FeatureLink from "./FeatureLink";
import PageMain from "./PageMain";
import TabDescription from "./TabDescription";
import type { VocabPair } from "./types";
import { extractVocabFromChunk } from "./vocab-extract-api";
import { chunkText, dedupeVocabPairs, toTsv } from "./vocabExtract";

type ExtractState =
  | { status: "idle" }
  | { status: "extracting"; totalChunks: number; completedChunks: number }
  | { status: "done"; pairs: VocabPair[] }
  | {
      status: "error";
      message: string;
      completedChunks: number;
      totalChunks: number;
    };

const fieldClassName =
  "border-2 border-black rounded-md px-4 py-2.5 text-sm bg-slate-100 text-blue-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y";

function VocabExtractPage() {
  const { apiKey, setApiKey } = useApiKey();
  const [text, setText] = useState("");
  const [state, setState] = useState<ExtractState>({ status: "idle" });
  const [pendingExtract, setPendingExtract] = useState<
    ((key: string) => void) | null
  >(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  function withApiKey(action: (key: string) => void) {
    if (apiKey) {
      action(apiKey);
    } else {
      setPendingExtract(() => action);
    }
  }

  function handleApiKeySubmit(key: string) {
    setApiKey(key);
    const action = pendingExtract;
    setPendingExtract(null);
    action?.(key);
  }

  async function runExtract(currentText: string, key: string) {
    const chunks = chunkText(currentText);
    if (chunks.length === 0) return;

    setState({
      status: "extracting",
      totalChunks: chunks.length,
      completedChunks: 0,
    });
    const collected: VocabPair[] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const items = await extractVocabFromChunk(chunks[i], key);
        collected.push(...items);
        setState({
          status: "extracting",
          totalChunks: chunks.length,
          completedChunks: i + 1,
        });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Something went wrong",
          completedChunks: i,
          totalChunks: chunks.length,
        });
        return;
      }
    }

    setState({ status: "done", pairs: dedupeVocabPairs(collected) });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || state.status === "extracting") return;
    withApiKey((key) => runExtract(text, key));
  }

  async function handleCopy(tsv: string) {
    try {
      await navigator.clipboard.writeText(tsv);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <PageMain gap={4}>
      <TabDescription>
        Paste an Estonian text and extract the vocabulary, with English
        translations.
        <br />
        <br />
        <b>Output :</b> it will produce a tab-separated list, ready to paste
        into a spreadsheet. Or into the <FeatureLink id="vocabPractice" />{" "}
        exercise. The words are always in their base form (first form singular,
        -ma infinitive for verbs, etc.)
        <br />
        <br />
        <b>Note :</b> this will try to extract the non-obvious vocabulary. i.e.
        it will ignore "mina", "läheb", "kus", etc. It should be mostly useful
        for a A2 or B1-level student.
      </TabDescription>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an Estonian text here…"
          rows={12}
          disabled={state.status === "extracting"}
          className={fieldClassName}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!text.trim() || state.status === "extracting"}
            className="flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Extract vocabulary
          </button>
          {state.status === "extracting" && (
            <span className="flex items-center gap-1.5 text-sm text-blue-700">
              <RefreshCcw size={14} className="animate-spin" />
              Extracting chunk {state.completedChunks + 1} of{" "}
              {state.totalChunks}…
            </span>
          )}
        </div>
      </form>

      {state.status === "error" && (
        <div className="flex flex-col gap-2 text-sm text-red-600">
          <p>
            {state.message}
            {state.completedChunks > 0 &&
              ` (stopped after chunk ${state.completedChunks} of ${state.totalChunks})`}
          </p>
          <button
            onClick={() => withApiKey((key) => runExtract(text, key))}
            className="self-start rounded-lg border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {state.status === "done" &&
        (state.pairs.length === 0 ? (
          <p className="text-sm text-gray-600">
            No non-obvious vocabulary found in this text.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Extracted vocabulary ({state.pairs.length} words)
              </h2>
              <button
                onClick={() => handleCopy(toTsv(state.pairs))}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-green-600" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="border-2 border-black rounded-md bg-slate-50 p-3 text-sm font-mono overflow-x-auto">
              {toTsv(state.pairs)}
            </pre>
            {copyError && (
              <p className="text-xs text-gray-500">
                Couldn't copy automatically — select the text above and copy
                manually.
              </p>
            )}
          </div>
        ))}

      {pendingExtract && (
        <ApiKeyModal
          onSubmit={handleApiKeySubmit}
          onCancel={() => setPendingExtract(null)}
        />
      )}
    </PageMain>
  );
}

export default VocabExtractPage;

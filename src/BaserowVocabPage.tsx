import { Check, RefreshCcw } from "lucide-react";
import { useState } from "react";
import CredentialForm from "./CredentialForm";
import { CREDENTIALS, useCredential } from "./CredentialsContext";
import PageMain from "./PageMain";
import TabDescription from "./TabDescription";
import {
  createRows,
  fetchAllRows,
  updateEnglish,
  type BaserowCredentials,
} from "./baserow-api";
import { classifyVocab, type VocabConflict } from "./baserowVocab";
import { toTsv } from "./vocabExtract";
import { parseVocabPaste } from "./vocabIngest";
import type { VocabPair } from "./types";

interface AddResult {
  added: VocabPair[];
  identical: VocabPair[];
  conflicts: VocabConflict[];
}

type Choice = "existing" | "new" | "custom";

interface Resolution {
  choice: Choice;
  custom: string;
}

type PageState =
  | { status: "idle" }
  | { status: "working"; message: string }
  | { status: "review"; result: AddResult }
  | { status: "updating"; result: AddResult }
  | { status: "done"; result: AddResult; updatedCount: number }
  | {
      status: "error";
      message: string;
      retry: () => void;
      result?: AddResult;
    };

const fieldClassName =
  "border-2 border-black rounded-md px-4 py-2.5 text-sm bg-slate-100 text-blue-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y";

const primaryButtonClassName =
  "flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

function chosenEnglish(conflict: VocabConflict, resolution: Resolution) {
  switch (resolution.choice) {
    case "existing":
      return conflict.existingEnglish;
    case "new":
      return conflict.newEnglish;
    case "custom":
      return resolution.custom.trim();
  }
}

function BaserowVocabPage() {
  const baserow = useCredential("baserow");
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState(false);
  const [state, setState] = useState<PageState>({ status: "idle" });
  const [resolutions, setResolutions] = useState<Resolution[]>([]);

  const creds: BaserowCredentials = {
    token: baserow.values.token,
    tableId: baserow.values.tableId,
  };

  async function runAdd(pairs: VocabPair[]) {
    try {
      setState({ status: "working", message: "Reading the Baserow table…" });
      const rows = await fetchAllRows(creds, (count) =>
        setState({
          status: "working",
          message: `Reading the Baserow table… (${count} rows)`,
        }),
      );
      const { toAdd, identical, conflicts } = classifyVocab(pairs, rows);
      if (toAdd.length > 0) {
        setState({
          status: "working",
          message: `Adding ${toAdd.length} new words…`,
        });
        await createRows(creds, toAdd);
      }
      setResolutions(conflicts.map(() => ({ choice: "existing", custom: "" })));
      setState({
        status: "review",
        result: { added: toAdd, identical, conflicts },
      });
    } catch (err) {
      // Retrying re-reads the table, so words added before the failure
      // are then treated as duplicates rather than added twice.
      setState({
        status: "error",
        message: errorMessage(err),
        retry: () => runAdd(pairs),
      });
    }
  }

  async function runUpdate(
    result: AddResult,
    updates: { id: number; english: string }[],
  ) {
    try {
      setState({ status: "updating", result });
      await updateEnglish(creds, updates);
      setState({ status: "done", result, updatedCount: updates.length });
    } catch (err) {
      setState({
        status: "error",
        message: errorMessage(err),
        retry: () => runUpdate(result, updates),
        result,
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pairs = parseVocabPaste(text);
    setParseError(!pairs);
    if (pairs) runAdd(pairs);
  }

  function handleApplyUpdates(e: React.FormEvent, result: AddResult) {
    e.preventDefault();
    const updates = result.conflicts.flatMap((conflict, i) => {
      const english = chosenEnglish(conflict, resolutions[i]);
      return english && english !== conflict.existingEnglish
        ? [{ id: conflict.rowId, english }]
        : [];
    });
    runUpdate(result, updates);
  }

  function updateResolution(index: number, patch: Partial<Resolution>) {
    setResolutions((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function reset() {
    setText("");
    setResolutions([]);
    setState({ status: "idle" });
  }

  const description = (
    <TabDescription>
      Paste new vocabulary (one <code>estonian⇥english</code> pair per line,
      e.g. copied from a spreadsheet) to add it to your Baserow vocabulary
      table. New words are added straight away; for words already in the table,
      you choose which English translation to keep.
    </TabDescription>
  );

  if (!baserow.isSet) {
    return (
      <PageMain gap={4}>
        {description}
        <div className="flex flex-col gap-4 max-w-md">
          <div>
            <h2 className="text-lg font-bold text-blue-700">
              {CREDENTIALS.baserow.title}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {CREDENTIALS.baserow.description} The table must have{" "}
              <code>Estonian</code> and <code>English</code> text fields.
            </p>
          </div>
          <CredentialForm
            kind="baserow"
            submitLabel="Save"
            onSubmit={baserow.set}
          />
        </div>
      </PageMain>
    );
  }

  const result =
    state.status === "review" ||
    state.status === "updating" ||
    state.status === "done" ||
    state.status === "error"
      ? state.result
      : undefined;
  const busy = state.status === "working" || state.status === "updating";
  const showInput = state.status === "idle" || state.status === "working";

  return (
    <PageMain gap={4}>
      {description}

      {(showInput || (state.status === "error" && !result)) && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"minema\tto go\nlubama\tto allow, to permit"}
            rows={12}
            disabled={busy}
            className={`${fieldClassName} font-mono`}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!text.trim() || busy}
              className={primaryButtonClassName}
            >
              Add to Baserow
            </button>
            {state.status === "working" && (
              <span className="flex items-center gap-1.5 text-sm text-blue-700">
                <RefreshCcw size={14} className="animate-spin" />
                {state.message}
              </span>
            )}
          </div>
          {parseError && (
            <p className="text-sm text-red-600">
              No vocabulary found — each line should be an Estonian word, a tab,
              then its English translation.
            </p>
          )}
        </form>
      )}

      {result && (
        <div className="flex flex-col gap-2">
          {result.added.length > 0 ? (
            <>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                <Check size={16} />
                Added {result.added.length} new{" "}
                {result.added.length === 1 ? "word" : "words"} to Baserow
              </h2>
              <pre className="border-2 border-black rounded-md bg-slate-50 p-3 text-sm font-mono overflow-x-auto">
                {toTsv(result.added)}
              </pre>
            </>
          ) : (
            <p className="text-sm text-gray-600">No new words to add.</p>
          )}
          {result.identical.length > 0 && (
            <p className="text-sm text-gray-600">
              {result.identical.length} already in the table with the same
              translation: {result.identical.map((p) => p.estonian).join(", ")}.
            </p>
          )}
        </div>
      )}

      {result && result.conflicts.length > 0 && state.status !== "done" && (
        <form
          onSubmit={(e) => handleApplyUpdates(e, result)}
          className="flex flex-col gap-3"
        >
          <h2 className="text-sm font-semibold text-gray-700">
            {result.conflicts.length} already in the table with a different
            translation — choose which one to keep
          </h2>
          {result.conflicts.map((conflict, i) => {
            const resolution = resolutions[i];
            const name = `conflict-${conflict.rowId}`;
            return (
              <fieldset
                key={conflict.rowId}
                disabled={busy}
                className="flex flex-col gap-1.5 rounded-lg border border-gray-300 p-3 text-sm"
              >
                <legend className="px-1 font-bold text-gray-900">
                  {conflict.estonian}
                </legend>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={name}
                    checked={resolution.choice === "existing"}
                    onChange={() => updateResolution(i, { choice: "existing" })}
                    className="mt-1"
                  />
                  <span>
                    <span className="text-gray-500">Keep existing: </span>
                    {conflict.existingEnglish || (
                      <em className="text-gray-400">(empty)</em>
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={name}
                    checked={resolution.choice === "new"}
                    onChange={() => updateResolution(i, { choice: "new" })}
                    className="mt-1"
                  />
                  <span>
                    <span className="text-gray-500">Use new: </span>
                    {conflict.newEnglish}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={name}
                    checked={resolution.choice === "custom"}
                    onChange={() => updateResolution(i, { choice: "custom" })}
                  />
                  <span className="text-gray-500">Custom:</span>
                  <input
                    type="text"
                    value={resolution.custom}
                    onFocus={() => updateResolution(i, { choice: "custom" })}
                    onChange={(e) =>
                      updateResolution(i, {
                        choice: "custom",
                        custom: e.target.value,
                      })
                    }
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </fieldset>
            );
          })}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={
                busy ||
                result.conflicts.some(
                  (_, i) =>
                    resolutions[i].choice === "custom" &&
                    !resolutions[i].custom.trim(),
                )
              }
              className={primaryButtonClassName}
            >
              Apply updates
            </button>
            {state.status === "updating" && (
              <span className="flex items-center gap-1.5 text-sm text-blue-700">
                <RefreshCcw size={14} className="animate-spin" />
                Updating Baserow…
              </span>
            )}
          </div>
        </form>
      )}

      {state.status === "done" && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
          <Check size={16} />
          {state.updatedCount === 0
            ? "No translations changed."
            : `Updated ${state.updatedCount} ${state.updatedCount === 1 ? "translation" : "translations"} in Baserow.`}
        </p>
      )}

      {state.status === "error" && (
        <div className="flex flex-col gap-2 text-sm text-red-600">
          <p>{state.message}</p>
          <button
            onClick={state.retry}
            className="self-start rounded-lg border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {(state.status === "done" ||
        (state.status === "review" && result?.conflicts.length === 0)) && (
        <button
          onClick={reset}
          className="self-start rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Add more vocab
        </button>
      )}
    </PageMain>
  );
}

export default BaserowVocabPage;

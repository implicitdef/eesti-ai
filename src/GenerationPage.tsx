import { useState } from "react";
import { useApiKey } from "./ApiKeyContext";
import BackToListLink from "./BackToListLink";
import { useFromTheme } from "./FromThemeContext";
import GenerateForm from "./GenerateForm";
import PageMain from "./PageMain";
import TabDescription from "./TabDescription";

function parseListLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function GenerationPage() {
  const { apiKey } = useApiKey();
  const {
    level,
    setLevel,
    generatingSource,
    isGenerating,
    generateNew,
    generateFromList,
  } = useFromTheme();
  const [themeInput, setThemeInput] = useState("");
  const [listMode, setListMode] = useState(false);

  function handleToggleListMode() {
    setListMode((prev) => !prev);
    setThemeInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (listMode) {
      const lines = parseListLines(themeInput);
      if (lines.length === 0) return;
      generateFromList(lines, 1, level);
    } else {
      const theme = themeInput.trim();
      if (!theme) return;
      generateNew(theme, 1, level);
    }
  }

  function handleGenerateBatch() {
    if (listMode) {
      const lines = parseListLines(themeInput);
      if (lines.length === 0) return;
      generateFromList(lines, 3, level);
    } else {
      const theme = themeInput.trim();
      if (!theme) return;
      generateNew(theme, 3, level);
    }
  }

  return (
    <PageMain gap={4}>
      <BackToListLink />

      <TabDescription>
        Generate a translation exercise, English to Estonian.
        <br />
        The sentence to guess will be based on the little input you give.
        <br />- For example, if you type "family", you might have to find the
        sentence "Minu perekonnas on neli inimest ja üks koer".
        <br />- Or if you type "hädas olema", you might get "Ta helistas mulle,
        kuna oli suures hädas". <br />
        Generating a sentence will make some requests to Anthropic API.
        {!apiKey && (
          <>
            {" "}
            Try the demo sentences for free — you'll be asked for an API key
            only when you generate your own.
          </>
        )}
      </TabDescription>

      {listMode && (
        <p className="text-xs text-gray-500">
          Write a list of words (one by line). Each line will be used separately
          to each generate one sentence (or 3, if you click the 3x button).
          <br />
          <span className="text-amber-600 font-medium">
            If your list is very long, this might get expensive!
          </span>
        </p>
      )}

      <GenerateForm
        value={themeInput}
        onChange={setThemeInput}
        onSubmit={handleSubmit}
        onGenerateBatch={handleGenerateBatch}
        placeholder={
          listMode
            ? "õun\nlahti tegema\njalkat\nminu arust\n..."
            : "Type a theme (in English) or some words or idiom (in Estonian)"
        }
        submitLoading={generatingSource === "single"}
        batchLoading={generatingSource === "batch"}
        disabled={isGenerating}
        multiline={listMode}
        level={level}
        onLevelChange={setLevel}
      />

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={listMode}
          onChange={handleToggleListMode}
          disabled={isGenerating}
        />
        Generate from a vocabulary list
      </label>

      {!listMode && (
        <p className="text-xs text-gray-400">
          e.g. "beach", "forest", "job interview", "at the gym", ... OR "tööle
          võtma", "rääkimata", "X-ks valmis", "ostma VS otsima", ...
        </p>
      )}
    </PageMain>
  );
}

export default GenerationPage;

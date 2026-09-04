import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useApiKey } from "./ApiKeyContext";
import { useFromTheme } from "./FromThemeContext";
import GenerateForm from "./GenerateForm";
import TabDescription from "./TabDescription";

function GenerationPage() {
  const { apiKey } = useApiKey();
  const { level, setLevel, generatingSource, isGenerating, generateNew } =
    useFromTheme();
  const [themeInput, setThemeInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const theme = themeInput.trim();
    if (!theme) return;
    generateNew(theme, 1, level);
  }

  function handleGenerateBatch() {
    const theme = themeInput.trim();
    if (!theme) return;
    generateNew(theme, 3, level);
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Link
          to="/"
          className="self-start text-sm text-gray-500 hover:text-blue-700 transition-colors"
        >
          ← Back to the sentences list
        </Link>

        <TabDescription>
          Generate a translation exercise, English to Estonian.
          <br />
          The sentence to guess will be based on the little input you give.
          <br />- For example, if you type "family", you might have to find the
          sentence "Minu perekonnas on neli inimest ja üks koer".
          <br />- Or if you type "hädas olema", you might get "Ta helistas
          mulle, kuna oli suures hädas". <br />
          Generating a sentence will make some requests to Anthropic API.
          {!apiKey && (
            <>
              {" "}
              Try the demo sentences for free — you'll be asked for an API key
              only when you generate your own.
            </>
          )}
        </TabDescription>

        <GenerateForm
          value={themeInput}
          onChange={setThemeInput}
          onSubmit={handleSubmit}
          onGenerateBatch={handleGenerateBatch}
          placeholder="Type a theme (in English) or some words or idiom (in Estonian)"
          submitLoading={generatingSource === "single"}
          batchLoading={generatingSource === "batch"}
          disabled={isGenerating}
          level={level}
          onLevelChange={setLevel}
        />
        <p className="text-xs text-gray-400">
          e.g. "beach", "forest", "job interview", "at the gym", ... OR "tööle
          võtma", "rääkimata", "X-ks valmis", "ostma VS otsima", ...
        </p>
      </div>
    </main>
  );
}

export default GenerationPage;

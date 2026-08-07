import { Link, Outlet } from "@tanstack/react-router";
import { NotebookPen, Play, Shuffle, TrendingUpDown, X } from "lucide-react";
import { useState } from "react";
import ApiKeyScreen from "./ApiKeyScreen";

const STORAGE_KEY = "eesti-ai-api-key";

const activeLinkClass =
  "flex items-center gap-1.5 border-b-2 border-blue-700 text-blue-700 font-semibold pb-2";
const inactiveLinkClass =
  "flex items-center gap-1.5 border-b-2 border-transparent text-gray-500 hover:text-gray-800 pb-2 transition-colors";

const activeLinkClassSmall = `${activeLinkClass} text-sm`;
const inactiveLinkClassSmall = `${inactiveLinkClass} text-sm`;

function LegacyBadge() {
  return (
    <span className="rounded-full bg-gray-300 px-1.5 py-0.75 text-[10px] leading-none font-medium tracking-wide text-black uppercase">
      legacy
    </span>
  );
}

function RootLayout() {
  const [apiKey, setApiKeyState] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );

  function handleSetApiKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  }

  function handleClearApiKey() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState("");
  }

  if (!apiKey) {
    return <ApiKeyScreen onSubmit={handleSetApiKey} />;
  }

  const keyTail = apiKey.slice(-5);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-slate-300 text-slate-700 p-4 shadow">
        <h1 className="text-2xl font-bold uppercase inline">Eesti AI</h1>
        <span className="text-sm text-blue-700 ml-2">
          Practice Estonian with AI
        </span>
      </header>

      <nav className="flex items-end justify-between gap-6 px-6 pt-3 border-b border-gray-200">
        <div className="flex items-end gap-6">
          <Link
            to="/"
            activeProps={{ className: activeLinkClass }}
            inactiveProps={{ className: inactiveLinkClass }}
            activeOptions={{ exact: true }}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500 text-white">
              <NotebookPen size={14} />
            </span>
            From theme or words
          </Link>
          <Link
            to="/video"
            activeProps={{ className: activeLinkClass }}
            inactiveProps={{ className: inactiveLinkClass }}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500 text-white">
              <Play size={14} fill="currentColor" />
            </span>
            Watch video with subtitles and cheatsheet
          </Link>
          <Link
            to="/from-sentence"
            activeProps={{ className: activeLinkClassSmall }}
            inactiveProps={{ className: inactiveLinkClassSmall }}
          >
            <TrendingUpDown size={14} className="shrink-0" />
            Variant of sentence
            <LegacyBadge />
          </Link>
          <Link
            to="/mixing-sentences"
            activeProps={{ className: activeLinkClassSmall }}
            inactiveProps={{ className: inactiveLinkClassSmall }}
          >
            <Shuffle size={14} className="shrink-0" />
            Mixing sentences
            <LegacyBadge />
          </Link>
        </div>
      </nav>

      <Outlet />

      <footer className="border-t border-gray-400">
        <div className="flex items-center justify-end sm:justify-between px-4 sm:px-6 py-3">
          <div className="hidden sm:flex items-center gap-2">
            <code
              className="font-mono text-xs text-gray-500"
              title="Build version"
            >
              version: {__APP_VERSION__}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1">
              <span className="text-xs text-gray-400">API key ending in</span>
              <code className="font-mono text-xs text-gray-600">{keyTail}</code>
            </div>
            <button
              onClick={handleClearApiKey}
              title="Clear API key"
              className="flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs text-gray-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default RootLayout;

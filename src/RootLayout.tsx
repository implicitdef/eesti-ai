import { Link, Outlet } from "@tanstack/react-router";
import { NotebookPen, Play, X } from "lucide-react";
import { useState } from "react";
import ApiKeyScreen from "./ApiKeyScreen";

const STORAGE_KEY = "eesti-ai-api-key";

const activeLinkClass =
  "px-2 flex items-center gap-1.5 border-b-3 border-blue-500 text-blue-700  pb-2 pt-2";
const inactiveLinkClass =
  "px-2 flex items-center gap-1.5 border-b-3 border-transparent text-black hover:text-gray-800 pb-2 pt-2 transition-colors";

const activeIconColorClass = "text-blue-600";
const inactiveIconColorClass = "text-gray-400";

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
      <header className="bg-black text-white px-2 py-1 shadow">
        <h1 className="text-2xl font-bold uppercase inline">Eesti AI</h1>
        <span className="text-sm text-blXue-700 ml-2">
          practice Estonian with AI
        </span>
      </header>

      <nav className="flex items-end justify-between gap-6 border-b border-black">
        <div className="flex items-end">
          <Link
            to="/"
            activeProps={{ className: activeLinkClass }}
            inactiveProps={{ className: inactiveLinkClass }}
            activeOptions={{ exact: true }}
          >
            {({ isActive }) => (
              <>
                <NotebookPen
                  size={16}
                  className={`shrink-0 ${isActive ? activeIconColorClass : inactiveIconColorClass}`}
                />
                From theme or words
              </>
            )}
          </Link>
          <Link
            to="/video"
            activeProps={{ className: activeLinkClass }}
            inactiveProps={{ className: inactiveLinkClass }}
          >
            {({ isActive }) => (
              <>
                <Play
                  size={16}
                  className={`shrink-0 ${isActive ? activeIconColorClass : inactiveIconColorClass}`}
                />
                Watch video with subtitles and cheatsheet
              </>
            )}
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

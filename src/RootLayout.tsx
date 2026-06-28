import { useState } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { X } from "lucide-react";
import ApiKeyScreen from "./ApiKeyScreen";

const STORAGE_KEY = "eesti-ai-api-key";

const activeLinkClass =
  "border-b-2 border-blue-700 text-blue-700 font-semibold pb-2";
const inactiveLinkClass =
  "border-b-2 border-transparent text-gray-500 hover:text-gray-800 pb-2 transition-colors";

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
      <header className="bg-blue-700 text-white p-4 shadow">
        <h1 className="text-2xl font-bold">Eesti AI</h1>
        <p className="text-sm text-blue-200">Learn Estonian with AI</p>
      </header>

      <nav className="flex gap-6 px-6 pt-3 border-b border-gray-200">
        <Link
          to="/"
          activeProps={{ className: activeLinkClass }}
          inactiveProps={{ className: inactiveLinkClass }}
          activeOptions={{ exact: true }}
        >
          Analyze
        </Link>
        <Link
          to="/practice"
          activeProps={{ className: activeLinkClass }}
          inactiveProps={{ className: inactiveLinkClass }}
        >
          Practice
        </Link>
      </nav>

      <Outlet />

      <footer className="border-t border-gray-400">
        <div className="flex items-center justify-end sm:justify-between px-4 sm:px-6 py-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-bold text-blue-700 tracking-tight">
              Eesti AI
            </span>
            <span className="text-gray-400 select-none">|</span>
            <span className="text-xs text-gray-500">Learn Estonian with AI</span>
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

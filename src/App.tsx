import { useState } from "react";
import { X } from "lucide-react";
import ApiKeyScreen from "./ApiKeyScreen";

const STORAGE_KEY = "eesti-ai-api-key";

function App() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );

  function handleSetApiKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  }

  function handleClearApiKey() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey("");
  }

  if (!apiKey) {
    return <ApiKeyScreen onSubmit={handleSetApiKey} />;
  }

  const maskedKey =
    apiKey.slice(0, 6) +
    "*".repeat(Math.max(0, apiKey.length - 10)) +
    apiKey.slice(-4);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-700 text-white p-4 shadow">
        <h1 className="text-2xl font-bold">Eesti AI</h1>
        <p className="text-sm text-blue-200">Learn Estonian with AI</p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow p-6">
          <p className="text-gray-500 text-center">Chat coming soon...</p>
        </div>
      </main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-700 tracking-tight">
              Eesti AI
            </span>
            <span className="text-gray-200 select-none">|</span>
            <span className="text-xs text-gray-400">Learn Estonian with AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1">
              <span className="text-xs text-gray-400">API key</span>
              <code className="font-mono text-xs text-gray-600">{maskedKey}</code>
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

export default App;

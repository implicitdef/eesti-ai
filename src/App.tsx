import { useState } from "react";
import ApiKeyScreen from "./ApiKeyScreen";

const STORAGE_KEY = "eesti-ai-api-key";

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");

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
    apiKey.slice(0, 6) + "*".repeat(Math.max(0, apiKey.length - 10)) + apiKey.slice(-4);

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
      <footer className="flex items-center justify-center gap-3 py-2 text-sm text-gray-400">
        <span>API key: {maskedKey}</span>
        <button
          onClick={handleClearApiKey}
          className="text-xs underline hover:text-gray-600 transition-colors"
        >
          clear
        </button>
      </footer>
    </div>
  );
}

export default App;

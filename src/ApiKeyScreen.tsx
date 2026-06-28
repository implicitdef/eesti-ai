import { useState } from "react";

interface Props {
  onSubmit: (key: string) => void;
}

function ApiKeyScreen({ onSubmit }: Props) {
  const [key, setKey] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Eesti AI</h1>
          <p className="text-blue-500 text-sm mt-1">Learn Estonian with AI</p>
        </div>
        <p className="text-gray-600 text-sm">
          Enter your Anthropic API key to get started. It will be saved in your
          browser's local storage and can be cleared at any time.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="sk-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
          >
            Get started
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApiKeyScreen;

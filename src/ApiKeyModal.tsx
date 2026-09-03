import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  onSubmit: (key: string) => void;
  onCancel: () => void;
}

function ApiKeyModal({ onSubmit, onCancel }: Props) {
  const [key, setKey] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow p-8 flex flex-col gap-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          title="Cancel"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-blue-700">
            Enter your Anthropic API key
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Generating a sentence needs an Anthropic API key. It will be saved
            in your browser's local storage and can be cleared at any time.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="password"
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
          >
            Save and generate
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApiKeyModal;

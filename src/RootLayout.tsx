import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { KeyRound, X } from "lucide-react";
import { useState } from "react";
import { ApiKeyProvider, useApiKey } from "./ApiKeyContext";
import ApiKeyModal from "./ApiKeyModal";

function ApiKeyFooterStatus() {
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [showModal, setShowModal] = useState(false);

  if (!apiKey) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-200"
        >
          <KeyRound size={12} />
          <span>Set API key</span>
        </button>
        {showModal && (
          <ApiKeyModal
            onSubmit={(key) => {
              setApiKey(key);
              setShowModal(false);
            }}
            onCancel={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  const keyTail = apiKey.slice(-5);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1">
        <span className="text-xs text-gray-400">API key ending in</span>
        <code className="font-mono text-xs text-gray-600">{keyTail}</code>
      </div>
      <button
        onClick={clearApiKey}
        title="Clear API key"
        className="flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs text-gray-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
      >
        <X size={12} />
        <span>Clear</span>
      </button>
    </div>
  );
}

function RootLayout() {
  const { pathname } = useLocation();
  const pageTitle = pathname.startsWith("/video")
    ? "Watch video with vocab"
    : pathname.startsWith("/ingest")
      ? "Vocabulary practice"
      : "Translation exercise";

  return (
    <ApiKeyProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-blue-900 text-white px-2 py-1 shadow">
          <Link to="/" className="no-underline">
            <h1 className="text-2xl font-bold uppercase inline text-white">
              Eesti AI
            </h1>
          </Link>
          <span className="text-sm text-blue-200 ml-2">{pageTitle}</span>
        </header>

        <Outlet />

        <footer className="border-t border-gray-400">
          <div className="flex items-center justify-end sm:justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2">
              <code
                className="hidden sm:inline font-mono text-xs text-gray-500"
                title="Build version"
              >
                version: {__APP_VERSION__}
              </code>
              <Link
                to="/video"
                className="text-xs text-gray-300 hover:text-gray-400 transition-colors"
              >
                video
              </Link>
              <Link
                to="/ingest"
                className="text-xs text-gray-300 hover:text-gray-400 transition-colors"
              >
                ingest
              </Link>
            </div>
            <ApiKeyFooterStatus />
          </div>
        </footer>
      </div>
    </ApiKeyProvider>
  );
}

export default RootLayout;

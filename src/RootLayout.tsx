import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";
import { ApiKeyProvider, useApiKey } from "./ApiKeyContext";

/** Secondary header showing the active API key, shown only once a key is set. */
function ApiKeyBar() {
  const { apiKey, clearApiKey } = useApiKey();

  if (!apiKey) return null;

  const keyTail = apiKey.slice(-5);

  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 sm:px-6 py-1.5 flex items-center justify-end gap-2">
      <div className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1">
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
    : pathname.startsWith("/vocab-practice")
      ? "Vocab practice"
      : "Translation exercise";

  return (
    <ApiKeyProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-blue-900 text-white px-4 py-2 shadow">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div>
              <Link to="/" className="no-underline">
                <h1 className="text-2xl font-bold uppercase inline text-white">
                  Eesti AI
                </h1>
              </Link>
              <span className="text-sm text-blue-200 ml-2">{pageTitle}</span>
            </div>

            <div className="flex flex-row sm:flex-col items-center justify-between sm:items-end flex-wrap gap-x-2 gap-y-1 w-full sm:w-auto">
              <div
                className="font-mono text-[11px] text-blue-300"
                title="Build version"
              >
                version: {__APP_VERSION__}
              </div>
              <nav className="flex items-center gap-1.5 text-xs text-blue-200 flex-wrap">
                <span className="text-blue-300">other features:</span>
                <Link
                  to="/vocab-practice"
                  className="text-blue-100 underline decoration-blue-500 hover:text-white transition-colors"
                >
                  Vocab practice
                </Link>
                <span className="text-blue-400">/</span>
                <Link
                  to="/video"
                  className="text-blue-100 underline decoration-blue-500 hover:text-white transition-colors"
                >
                  Video
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <ApiKeyBar />

        <Outlet />
      </div>
    </ApiKeyProvider>
  );
}

export default RootLayout;

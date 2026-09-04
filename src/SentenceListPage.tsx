import { Link } from "@tanstack/react-router";
import { itemStatus, StatusIcon } from "./StatusIcon";
import { formatThemeLevel } from "./ThemeLabel";
import { useFromTheme } from "./FromThemeContext";
import TabDescription from "./TabDescription";
import type { ThemePracticeItem } from "./types";

function SentenceRow({ item }: { item: ThemePracticeItem }) {
  return (
    <li>
      <Link
        to="/sentence/$id"
        params={{ id: item.id }}
        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <StatusIcon status={itemStatus(item)} />
        <span className="truncate">
          {formatThemeLevel(item.theme, item.level)}
        </span>
      </Link>
    </li>
  );
}

function SentenceListPage() {
  const { userItems, demoItems, clearUserItems, resetDemoItems } =
    useFromTheme();

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <TabDescription>
          Translation exercise, English to Estonian. Pick a sentence below to
          practice, or generate new ones from a theme, some words, or an idiom.
        </TabDescription>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Your sentences</h2>
            {userItems.length > 0 && (
              <button
                onClick={clearUserItems}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                title="Clear your sentences"
              >
                Clear all
              </button>
            )}
          </div>
          <Link
            to="/generate"
            className="self-start text-sm font-semibold text-blue-700 hover:text-blue-800 underline"
          >
            {userItems.length === 0
              ? "Generate your own sentences"
              : "Generate more"}
          </Link>
          {userItems.length > 0 && (
            <ul className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden mt-1">
              {userItems.map((item) => (
                <SentenceRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Demo sentences</h2>
            <button
              onClick={resetDemoItems}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
              title="Reset demo sentences to their original unsolved state"
            >
              Reset your answers
            </button>
          </div>
          <ul className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {demoItems.map((item) => (
              <SentenceRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default SentenceListPage;

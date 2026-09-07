import { Link } from "@tanstack/react-router";
import { useFromTheme } from "./FromThemeContext";
import PageMain from "./PageMain";
import { itemStatus, StatusIcon } from "./StatusIcon";
import TabDescription from "./TabDescription";
import { formatLevel } from "./ThemeLabel";
import type { ThemePracticeItem } from "./types";

function SentenceRow({ item }: { item: ThemePracticeItem }) {
  return (
    <li>
      <Link
        to="/sentence/$id"
        params={{ id: item.id }}
        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-100 transition-colors"
      >
        <StatusIcon status={itemStatus(item)} />
        <span className="truncate">
          "{item.theme}"{" "}
          <span className="text-gray-500 italic text-xs">
            {formatLevel(item.level)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function SentenceListPage() {
  const { userItems, demoItems, clearUserItems, resetDemoItems } =
    useFromTheme();

  return (
    <PageMain>
      <TabDescription>
        Translation exercise, English to Estonian. Pick a sentence below to
        practice, or generate new ones from a theme, some words, or an idiom.
      </TabDescription>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
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
          <ul className="flex flex-col bg-blue-50 divide-y divide-gray-400 rounded-lg overflow-hidden mt-1">
            {userItems.map((item) => (
              <SentenceRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Demo sentences</h2>
          <button
            onClick={resetDemoItems}
            className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
            title="Reset demo sentences to their original unsolved state"
          >
            Reset your answers
          </button>
        </div>
        <ul className="flex flex-col bg-blue-50 divide-y divide-gray-400 rounded-lg overflow-hidden mt-1">
          {demoItems.map((item) => (
            <SentenceRow key={item.id} item={item} />
          ))}
        </ul>
      </section>
    </PageMain>
  );
}

export default SentenceListPage;

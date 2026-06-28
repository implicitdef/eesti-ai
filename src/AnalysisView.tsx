import type { AnalysisEntry } from "./types";

interface Props {
  entry: AnalysisEntry;
}

const CASE_ENDINGS: Record<string, string> = {
  illative: "-sse",
  inessive: "-s",
  elative: "-st",
  allative: "-le",
  adessive: "-l",
  ablative: "-lt",
  translative: "-ks",
  terminative: "-ni",
  essive: "-na",
  abessive: "-ta",
  comitative: "-ga",
};

function annotateGrammaticalInfo(info: string): string {
  const lower = info.toLowerCase();
  for (const [caseName, ending] of Object.entries(CASE_ENDINGS)) {
    if (lower.includes(caseName)) {
      return `${info} (${ending})`;
    }
  }
  return info;
}

function displayBaseForm(word: string, baseForm: string | null): string | null {
  if (!baseForm) return null;
  return baseForm.toLowerCase() === word.toLowerCase() ? null : baseForm;
}

function AnalysisView({ entry }: Props) {
  const hasBaseForm = entry.words.some(
    (w) => displayBaseForm(w.word, w.baseForm) !== null,
  );
  const hasGrammaticalInfo = entry.words.some((w) => w.grammaticalInfo);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Original
        </p>
        <p className="text-lg font-semibold text-gray-800">
          {entry.originalText}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Translation
        </p>
        <p className="text-base text-blue-700 font-medium">
          {entry.fullTranslation}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Word Analysis
        </p>
        <div className="sm:hidden flex flex-col divide-y divide-gray-200">
          {entry.words.map((w, i) => {
            const baseForm = displayBaseForm(w.word, w.baseForm);
            return (
              <div key={i} className="grid grid-cols-2 gap-2 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-gray-800">{w.word}</span>
                  <span className="text-sm text-blue-700">{w.translation}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                  <span>{w.wordType}</span>
                  {w.grammaticalInfo && (
                    <span className="text-gray-400">
                      {annotateGrammaticalInfo(w.grammaticalInfo)}
                    </span>
                  )}
                  {baseForm && (
                    <span className="text-gray-400">base: {baseForm}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 pr-4 font-semibold text-gray-500 whitespace-nowrap">
                  Word
                </th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-500 whitespace-nowrap">
                  Type
                </th>
                {hasBaseForm && (
                  <th className="text-left py-2 pr-4 font-semibold text-gray-500 whitespace-nowrap">
                    Base form
                  </th>
                )}
                <th className="text-left py-2 pr-4 font-semibold text-gray-500 whitespace-nowrap">
                  Translation
                </th>
                {hasGrammaticalInfo && (
                  <th className="text-left py-2 font-semibold text-gray-500 whitespace-nowrap">
                    Grammatical info
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {entry.words.map((w, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2 pr-4 font-medium text-gray-800 whitespace-nowrap">
                    {w.word}
                  </td>
                  <td className="py-2 pr-4 text-gray-500 text-xs whitespace-nowrap">
                    {w.wordType}
                  </td>
                  {hasBaseForm && (
                    <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                      {displayBaseForm(w.word, w.baseForm) ?? "—"}
                    </td>
                  )}
                  <td className="py-2 pr-4 text-gray-700">{w.translation}</td>
                  {hasGrammaticalInfo && (
                    <td className="py-2 text-gray-500 text-xs">
                      {w.grammaticalInfo
                        ? annotateGrammaticalInfo(w.grammaticalInfo)
                        : ""}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {entry.compoundExpressions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Compound Expressions
          </p>
          <div className="flex flex-col gap-3">
            {entry.compoundExpressions.map((expr, i) => (
              <div
                key={i}
                className="border-l-2 border-blue-400 pl-4 py-1 flex flex-col gap-1"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-gray-800">
                    {expr.expression}
                  </span>
                  <span className="text-blue-700 text-sm">
                    — {expr.translation}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{expr.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisView;

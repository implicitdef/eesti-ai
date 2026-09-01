import { RefreshCcw } from "lucide-react";

interface Props {
  onClick: () => void;
  spinning: boolean;
  disabled: boolean;
}

function GenerateAnotherButton({ onClick, spinning, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 border-gray-600 border bg-blue-100 text-gray-700 rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-blue-200 transition-colors disabled:cursor-not-allowed shrink-0 ${spinning ? "btn-shimmer" : ""}`}
    >
      <RefreshCcw
        size={12}
        className={`shrink-0 ${spinning ? "animate-spin" : ""}`}
      />
      {spinning ? "Generating…" : "Generate another from that theme"}
    </button>
  );
}

export default GenerateAnotherButton;

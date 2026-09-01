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
      className={`flex items-center gap-1.5 bg-blue-700 text-white rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:cursor-not-allowed shrink-0 ${spinning ? "btn-shimmer" : ""}`}
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

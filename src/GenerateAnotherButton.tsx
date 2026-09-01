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
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 underline transition-colors disabled:opacity-40 disabled:no-underline disabled:hover:text-gray-400 shrink-0 mb-0.5"
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

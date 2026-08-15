import { RefreshCcw } from "lucide-react";

interface Props {
  onClick: () => void;
  loading: boolean;
}

function GenerateAnotherButton({ onClick, loading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 underline transition-colors disabled:opacity-40 shrink-0 mb-0.5"
    >
      <RefreshCcw size={12} className="shrink-0" />
      {loading ? "Generating…" : "Generate another from that theme"}
    </button>
  );
}

export default GenerateAnotherButton;

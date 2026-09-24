import { X } from "lucide-react";
import CredentialForm from "./CredentialForm";
import { CREDENTIALS } from "./CredentialsContext";

interface Props {
  onSubmit: (key: string) => void;
  onCancel: () => void;
}

function ApiKeyModal({ onSubmit, onCancel }: Props) {
  const { title, description } = CREDENTIALS.anthropic;

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
          <h2 className="text-xl font-bold text-blue-700">{title}</h2>
          <p className="text-gray-600 text-sm mt-2">{description}</p>
        </div>
        <CredentialForm
          kind="anthropic"
          submitLabel="Save and generate"
          onSubmit={(values) => onSubmit(values.apiKey)}
        />
      </div>
    </div>
  );
}

export default ApiKeyModal;

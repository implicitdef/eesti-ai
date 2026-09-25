import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { usePersistedState } from "./usePersistedState";

function SettingsBox({
  storageKey,
  stacked,
  children,
}: {
  /** localStorage key remembering whether the box is unfolded. */
  storageKey: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = usePersistedState(storageKey, false);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div className="flex flex-col gap-3 bg-gray-200 p-4 -mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 w-fit"
      >
        <Chevron size={16} className="text-gray-500" />
        <Settings size={16} className="text-gray-500" />
        Settings
      </button>
      {open && (
        <div
          className={
            stacked
              ? "flex flex-col items-start gap-3"
              : "flex items-center gap-4 flex-wrap"
          }
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default SettingsBox;

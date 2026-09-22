import { Settings } from "lucide-react";
import type { ReactNode } from "react";

function SettingsBox({
  title,
  stacked,
  children,
}: {
  title: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 bg-gray-200 p-4 -mt-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <Settings size={16} className="text-gray-500" />
        {title}
      </div>
      <div
        className={
          stacked
            ? "flex flex-col items-start gap-3"
            : "flex items-center gap-4 flex-wrap"
        }
      >
        {children}
      </div>
    </div>
  );
}

export default SettingsBox;

import { useState } from "react";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";

export function useCollapsibleSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    toggle: () => setIsOpen((v) => !v),
    close: () => setIsOpen(false),
  };
}

export function SidebarToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden self-start flex items-center gap-1.5 shrink-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600"
    >
      <Menu size={16} />
      History
    </button>
  );
}

interface Props {
  sidebar: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

function SidebarLayout({ sidebar, isOpen, onClose, children }: Props) {
  return (
    <div className="flex-1 flex overflow-hidden relative">
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-10 md:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`absolute md:static inset-y-0 left-0 z-20 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {sidebar}
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>
    </div>
  );
}

export default SidebarLayout;

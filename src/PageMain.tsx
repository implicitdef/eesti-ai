import type { ReactNode } from "react";

function PageMain({ gap = 8, children }: { gap?: 4 | 8; children: ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <div
        className={`max-w-2xl mx-auto flex flex-col ${gap === 4 ? "gap-4" : "gap-8"}`}
      >
        {children}
      </div>
    </main>
  );
}

export default PageMain;

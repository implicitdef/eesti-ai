import type { ReactNode } from "react";

function PageMain({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-4">
      <div className={`max-w-2xl mx-auto flex flex-col gap-8`}>{children}</div>
    </main>
  );
}

export default PageMain;

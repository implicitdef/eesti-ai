import type { ReactNode } from "react";

const gapClassNames = {
  4: "gap-4",
  8: "gap-8",
} as const;

function PageMain({
  children,
  gap = 8,
}: {
  children: ReactNode;
  gap?: keyof typeof gapClassNames;
}) {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-4">
      <div className={`max-w-2xl mx-auto flex flex-col ${gapClassNames[gap]}`}>
        {children}
      </div>
    </main>
  );
}

export default PageMain;

import { Info } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

function TabDescription({ children }: Props) {
  return (
    <div className="flex items-start gap-2  text-sm text-gray-800 italic my-2 bg-lime-200 p-2 w-fit">
      <Info size={16} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export default TabDescription;

import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { usePersistedState } from "./usePersistedState";

type Props = {
  children: React.ReactNode;
} & (
  | { details?: undefined }
  | {
      /** Extra text, folded behind a "more" toggle. */
      details: React.ReactNode;
      /** localStorage key remembering whether the details are unfolded. */
      storageKey: string;
    }
);

function TabDescription(props: Props) {
  return (
    <div className="flex items-start gap-2  text-sm text-gray-800 italic my-2 bg-lime-200 p-2 w-fit">
      <Info size={16} className="mt-0.5 shrink-0" />
      {props.details === undefined ? (
        <p>{props.children}</p>
      ) : (
        <FoldableText storageKey={props.storageKey} details={props.details}>
          {props.children}
        </FoldableText>
      )}
    </div>
  );
}

function FoldableText({
  children,
  details,
  storageKey,
}: {
  children: React.ReactNode;
  details: React.ReactNode;
  storageKey: string;
}) {
  const [open, setOpen] = usePersistedState(storageKey, false);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div>
      <p>
        {children}{" "}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex items-center not-italic text-xs text-blue-600 hover:text-gray-900 underline font-bold "
        >
          <Chevron size={14} />
          {open ? "less" : "more"}
        </button>
      </p>
      {open && <p className="mt-3">{details}</p>}
    </div>
  );
}

export default TabDescription;

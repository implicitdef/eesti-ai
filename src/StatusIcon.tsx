import {
  Check,
  CircleAlert,
  Dot,
  Eye,
  PencilLine,
  RefreshCcw,
} from "lucide-react";
import type { ThemePracticeItem } from "./types";

export type ItemStatus =
  | "not_started"
  | "in_progress"
  | "revealed"
  | "solved"
  | "generating"
  | "error";

export function itemStatus(item: ThemePracticeItem): ItemStatus {
  if (item.status === "generating") return "generating";
  if (item.status === "error") return "error";
  if (item.revealed) return "revealed";
  if (item.status === "completed") return "solved";
  if (item.attempts.length > 0) return "in_progress";
  return "not_started";
}

export function StatusIcon({ status }: { status: ItemStatus }) {
  switch (status) {
    case "generating":
      return (
        <RefreshCcw
          size={14}
          className="shrink-0 text-blue-500 animate-spin"
          aria-label="Generating"
        />
      );
    case "error":
      return (
        <CircleAlert
          size={14}
          className="shrink-0 text-red-600"
          aria-label="Generation failed"
        />
      );
    case "solved":
      return (
        <Check
          size={16}
          strokeWidth={4}
          className="shrink-0 text-green-500"
          aria-label="Solved"
        />
      );
    case "revealed":
      return (
        <Eye
          size={14}
          className="shrink-0 text-red-500"
          aria-label="Answer revealed"
        />
      );
    case "in_progress":
      return (
        <PencilLine
          size={16}
          strokeWidth={2}
          className="shrink-0 text-orange-600"
          aria-label="In progress, mistakes made"
        />
      );
    case "not_started":
      return (
        <Dot
          size={14}
          strokeWidth={5}
          className="shrink-0 text-gray-500"
          aria-label="Not started"
        />
      );
  }
}

import type { VocabPair } from "../types";
import { parseVocabPaste } from "../vocabIngest";
import foodRaw from "./food.tsv?raw";

// Vocabulary lists shown to every user at the bottom of the Vocab practice
// page. Each .tsv file uses the same format as the paste box: Estonian word,
// one tab, English translation, one pair per line.
//
// To add a list: create a .tsv file in this folder, import it above and add
// an entry below. The `id` is what the user's progress is stored under, so
// keep it stable once published (renaming `name` is fine).
const SOURCES: { id: string; name: string; raw: string }[] = [
  { id: "food", name: "Foods and ingredients", raw: foodRaw },
];

export interface PregeneratedList {
  id: string;
  name: string;
  pairs: VocabPair[];
}

export const PREGENERATED_LISTS: PregeneratedList[] = SOURCES.map(
  ({ id, name, raw }) => ({
    id: `pregenerated-${id}`,
    name,
    pairs: parseVocabPaste(raw) ?? [],
  }),
);

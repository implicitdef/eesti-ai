import Anthropic from "@anthropic-ai/sdk";
import { MODEL, responseText } from "./anthropic-response";
import type { VocabPair } from "./types";

const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `You are helping an Estonian learner at approximately B1 level build a vocabulary list from a text they are reading.

You will receive a chunk of Estonian text. It may be only one part of a longer text, so the first or last sentence can start or end mid-thought — extract from it anyway.

Extract only vocabulary that is NOT obvious for a B1 learner (skip everyday basics like "mina", "lähevad", "toit"). Also extract idioms or fixed multi-word expressions where it makes more sense to treat them as one compound entry than as separate words.

For each item, give:
- "estonian": its base form — nominative singular for a noun or adjective, the -ma infinitive for a verb, or the canonical dictionary form for a multi-word expression/idiom
- "english": the English translation of that base form

If the chunk has no non-obvious vocabulary, return an empty list. Do not repeat the same base form twice within your answer.`;

export async function extractVocabFromChunk(
  chunk: string,
  apiKey: string,
): Promise<VocabPair[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: chunk }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  estonian: { type: "string" },
                  english: { type: "string" },
                },
                required: ["estonian", "english"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = JSON.parse(responseText(response)) as {
    items: { estonian: string; english: string }[];
  };

  return raw.items
    .map((item) => ({
      estonian: item.estonian.replace(/[\t\r\n]+/g, " ").trim(),
      english: item.english.replace(/[\t\r\n]+/g, " ").trim(),
    }))
    .filter((item) => item.estonian && item.english);
}

import type Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-5";

/**
 * Structured-output requests (output_config.format) always reply with a
 * text block, but models with thinking on by default (e.g. claude-sonnet-5)
 * prepend one or more "thinking" blocks first, so we can't assume content[0].
 */
export function responseText(response: Anthropic.Message): string {
  const block = response.content.find((b) => b.type === "text");
  if (!block) {
    const types = response.content.map((b) => b.type).join(", ");
    throw new Error(`Expected a text content block, got only: ${types}`);
  }
  return block.text;
}

export const MAX_PREVIOUS_SENTENCES = 5;

/**
 * Appended to a system prompt to steer the model away from repeating
 * sentences already generated for the same input.
 */
export function avoidRepeatsNote(previousSentences: string[]): string {
  if (previousSentences.length === 0) return "";
  const list = previousSentences.map((s) => `- ${s}`).join("\n");
  return `\n\nNote: for this same input, we have already generated the following sentences previously:\n${list}\nTry to generate something meaningfully different from these.`;
}

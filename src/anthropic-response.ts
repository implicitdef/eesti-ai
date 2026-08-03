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

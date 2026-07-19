import type Anthropic from "@anthropic-ai/sdk";

/**
 * Structured-output requests (output_config.format) always reply with a
 * single text block, but the SDK's ContentBlock type is a broad union (text,
 * thinking, tool use, etc.) since it also covers other request shapes.
 */
export function responseText(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Expected a text content block, got "${block.type}"`);
  }
  return block.text;
}

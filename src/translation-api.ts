import Anthropic from "@anthropic-ai/sdk";
import { MODEL, responseText } from "./anthropic-response";

export async function translateToEnglish(
  estonianSentence: string,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are an expert Estonian language teacher. Translate the given Estonian sentence to natural English.",
    messages: [
      { role: "user", content: `Estonian sentence: "${estonianSentence}"` },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            translation: { type: "string" },
          },
          required: ["translation"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = JSON.parse(responseText(response)) as { translation: string };
  return raw.translation;
}

export async function fixSentenceIfNeeded(
  estonianSentence: string,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are an expert Estonian language teacher. Check whether the given Estonian sentence is grammatically correct and sounds natural. If it is already correct and natural, return it unchanged. If not, return a corrected version that fixes the grammar and/or makes it sound natural, while keeping the meaning and wording as close to the original as possible.",
    messages: [
      { role: "user", content: `Estonian sentence: "${estonianSentence}"` },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            isCorrect: { type: "boolean" },
            correctedSentence: { type: "string" },
          },
          required: ["isCorrect", "correctedSentence"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = JSON.parse(responseText(response)) as {
    isCorrect: boolean;
    correctedSentence: string;
  };
  return raw.isCorrect ? estonianSentence : raw.correctedSentence;
}

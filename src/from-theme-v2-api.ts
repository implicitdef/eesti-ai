import Anthropic from "@anthropic-ai/sdk";
import { MODEL, responseText } from "./anthropic-response";
import { translateToEnglish } from "./sentence-practice-api";

export interface ThemeV2SentenceResult {
  sentence: string;
  englishTranslation: string;
}

async function createSentenceFromTheme(
  theme: string,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are an expert Estonian language teacher preparing a back-translation exercise.

You will be given a short input which is either (a) a theme or situation in English, or (b) an Estonian idiom or fixed expression.
- If it's an English theme, write ONE natural Estonian sentence about that theme/situation.
- If it's an Estonian idiom/expression, write ONE natural Estonian sentence that uses that idiom/expression naturally in context.

Requirements:
- Approximately B1 level
- Short: 6 to 12 words
- Simple, everyday vocabulary and grammar: one or two clauses at most
- Natural spoken or written Estonian, not academic or literary
- Grammatically correct`,
    messages: [{ role: "user", content: `Input: ${theme}` }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            sentence: { type: "string" },
          },
          required: ["sentence"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = JSON.parse(responseText(response)) as { sentence: string };
  return raw.sentence;
}

async function fixSentenceIfNeeded(
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

export async function generateThemeV2Sentence(
  theme: string,
  apiKey: string,
): Promise<ThemeV2SentenceResult> {
  const rawSentence = await createSentenceFromTheme(theme, apiKey);
  const sentence = await fixSentenceIfNeeded(rawSentence, apiKey);
  const englishTranslation = await translateToEnglish(sentence, apiKey);
  return { sentence, englishTranslation };
}

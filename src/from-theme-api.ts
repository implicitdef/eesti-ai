import Anthropic from "@anthropic-ai/sdk";
import { avoidRepeatsNote, MODEL, responseText } from "./anthropic-response";
import { fixSentenceIfNeeded, translateToEnglish } from "./translation-api";

export interface ThemeSentenceResult {
  sentence: string;
  englishTranslation: string;
}

async function createSentenceFromTheme(
  theme: string,
  apiKey: string,
  previousSentences: string[],
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
- Grammatically correct${avoidRepeatsNote(previousSentences)}`,
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

export async function generateThemeSentence(
  theme: string,
  apiKey: string,
  previousSentences: string[] = [],
): Promise<ThemeSentenceResult> {
  const rawSentence = await createSentenceFromTheme(
    theme,
    apiKey,
    previousSentences,
  );
  const sentence = await fixSentenceIfNeeded(rawSentence, apiKey);
  const englishTranslation = await translateToEnglish(sentence, apiKey);
  return { sentence, englishTranslation };
}

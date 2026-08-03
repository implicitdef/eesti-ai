import Anthropic from "@anthropic-ai/sdk";
import { MODEL, responseText } from "./anthropic-response";

export interface SentenceVariantResult {
  englishTranslation: string;
  variant: string;
  variantEnglishTranslation: string;
}

export async function generateVariant(
  estonianSentence: string,
  guidance: string,
  apiKey: string,
): Promise<SentenceVariantResult> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const guidanceClause = guidance
    ? `\n\nThe learner asked for this specific kind of variation, follow it preferentially (you may still add a secondary tweak on top): "${guidance}"`
    : "";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are an expert Estonian language teacher preparing a back-translation exercise.

Given an Estonian sentence, do the following:

1. Translate it to natural English ("englishTranslation").
2. Create "variant": an Estonian sentence that is a variation on the given one. It must reuse the vocabulary, the structure, but randomly apply 2-3 of these transformations :
   - tense change (past/present/future/perfect)
   - singular <-> plural
   - affirmation <-> negation
   - statement <-> question
   - pronoun or subject-person swap (ma/sa/ta/me/te/nad)
   - quantity or time-expression changes (today -> yesterday, always -> never, one -> several)
   This new sentence must have a somewhat coherent meaning.
3. Translate also this variant to English ("variantEnglishTranslation").`,
    messages: [
      { role: "user", content: `Estonian sentence: "${estonianSentence}"` },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            englishTranslation: {
              type: "string",
              description: "English translation of the input sentence",
            },
            variant: {
              type: "string",
              description:
                "an Estonian sentence, variant on the input sentence",
            },
            variantEnglishTranslation: {
              type: "string",
              description: "English translation of the variant sentence.",
            },
          },
          required: [
            "englishTranslation",
            "variant",
            "variantEnglishTranslation",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(responseText(response)) as SentenceVariantResult;
}

import Anthropic from "@anthropic-ai/sdk";
import { MODEL, responseText } from "./anthropic-response";

export interface SentenceVariantResult {
  englishTranslation: string;
  variant: string;
  variantEnglishTranslation: string;
}

async function translateToEnglish(
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

async function createVariant(
  estonianSentence: string,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are an expert Estonian language teacher preparing a back-translation exercise.

Create "variant": an Estonian sentence that is a variation on the given one. It must reuse the vocabulary, the structure, but randomly apply 2-3 of these transformations :
   - tense change (past/present/future/perfect)
   - singular <-> plural
   - affirmation <-> negation
   - statement <-> question
   - pronoun or subject-person swap (ma/sa/ta/me/te/nad)
   - quantity or time-expression changes (today -> yesterday, always -> never, one -> several)
This new sentence must have a somewhat coherent meaning.`,
    messages: [
      { role: "user", content: `Estonian sentence: "${estonianSentence}"` },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            variant: { type: "string" },
          },
          required: ["variant"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = JSON.parse(responseText(response)) as { variant: string };
  return raw.variant;
}

export async function generateVariant(
  estonianSentence: string,
  apiKey: string,
): Promise<SentenceVariantResult> {
  const [englishTranslation, variant] = await Promise.all([
    translateToEnglish(estonianSentence, apiKey),
    createVariant(estonianSentence, apiKey),
  ]);
  const variantEnglishTranslation = await translateToEnglish(variant, apiKey);

  return { englishTranslation, variant, variantEnglishTranslation };
}

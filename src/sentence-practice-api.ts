import Anthropic from "@anthropic-ai/sdk";
import { responseText } from "./anthropic-response";

export interface SentenceVariantResult {
  englishTranslation: string;
  englishVariant: string;
  variantDescription: string;
  expectedEstonian: string;
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
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: `You are an expert Estonian language teacher preparing a back-translation exercise.

Given an Estonian sentence, do the following:

1. Translate it to natural English ("englishTranslation").
2. Create "englishVariant": an English sentence that reuses similar vocabulary as the translation but changes it. Randomly combine one or more of these transformations (favor combining 2-3 when the guidance doesn't dictate otherwise):
   - tense change (past/present/future/perfect)
   - singular <-> plural
   - affirmation <-> negation
   - statement <-> question
   - adding/removing a modal verb (can, must, should, want to)
   - register change (formal <-> informal/polite)
   - pronoun or subject-person swap (I/you/he/she/we/they)
   - comparative/superlative forms
   - quantity or time-expression changes (today -> yesterday, always -> never, one -> several)
   - synonym substitution
   - simplification: if the original has multiple clauses or is complex, drop a subordinate clause or a detail to make it shorter
   Keep the variant natural, coherent English at roughly the same difficulty level as the input.${guidanceClause}
3. Write "variantDescription": a short (under 10 words) human-readable note of what changed, e.g. "past tense, negative". This is shown to the learner immediately, so it must NOT reveal any Estonian words.
4. Write "expectedEstonian": the single most natural, standard Estonian translation of "englishVariant". Since this is used as the one canonical answer key (no leniency grading), pick the most common, expected phrasing — not an unusual or overly literary one.`,
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
              description: "Natural English translation of the input sentence",
            },
            englishVariant: {
              type: "string",
              description:
                "The transformed English sentence for the learner to translate back",
            },
            variantDescription: {
              type: "string",
              description:
                "Short note of what changed, e.g. 'past tense, negative'",
            },
            expectedEstonian: {
              type: "string",
              description:
                "The single canonical Estonian translation of englishVariant",
            },
          },
          required: [
            "englishTranslation",
            "englishVariant",
            "variantDescription",
            "expectedEstonian",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(responseText(response)) as SentenceVariantResult;
}

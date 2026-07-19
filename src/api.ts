import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisEntry } from "./types";

const SYSTEM_PROMPT = `You are an expert in Estonian linguistics and translation. When given Estonian text (a word, expression, or sentence), you will:
1. Provide a complete, natural English translation of the entire input
2. Break down each word with its part of speech, translation, and grammatical information
3. Identify any idiomatic or compound expressions that are best understood as a unit rather than word by word

For wordType: always provide the part of speech — one of: noun, verb, adjective, adverb, pronoun, numeral, conjunction, preposition, postposition, particle, interjection.

For grammaticalInfo, use these exact formats:
- Nouns, adjectives, pronouns: case name only, with "plural" appended if plural, omitting "singular". Examples: "nominative", "genitive", "partitive plural", "allative", "comitative plural". Always determine case from syntactic context (e.g. the postposition "üle" governs the genitive, "koos" governs the comitative). Commit to exactly one case — never use parenthetical alternatives or slashes.
- Verbs (finite forms): "tense (person number)". Examples: "present (1st person singular)", "simple past (3rd person plural)", "conditional (2nd person singular)".
- Verbs (non-finite forms): include the suffix. Examples: "past participle (-nud)", "passive past participle (-tud)", "supine (-ma form)".
- Uninflected words (adverbs, conjunctions, prepositions, postpositions, particles, interjections): use null.

For baseForm: if grammaticalInfo is non-null, you MUST provide the base form — nominative singular for nouns/adjectives/pronouns (including compound and reciprocal pronouns), or the ma-infinitive for verbs. Use null only when the word is already in its base form and grammaticalInfo is null.`;

export async function analyzeEstonian(
  text: string,
  apiKey: string,
): Promise<AnalysisEntry> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            fullTranslation: {
              type: "string",
              description: "Complete, natural English translation of the input",
            },
            words: {
              type: "array",
              description: "Analysis of each word in the input",
              items: {
                type: "object",
                properties: {
                  word: {
                    type: "string",
                    description: "The word as it appears in the original text",
                  },
                  wordType: {
                    type: "string",
                    description:
                      "Part of speech: noun, verb, adjective, adverb, pronoun, numeral, conjunction, preposition, postposition, particle, or interjection",
                  },
                  baseForm: {
                    anyOf: [{ type: "string" }, { type: "null" }],
                    description:
                      "Dictionary/nominative form — null if already in base form",
                  },
                  translation: {
                    type: "string",
                    description: "English translation of this word in context",
                  },
                  grammaticalInfo: {
                    anyOf: [{ type: "string" }, { type: "null" }],
                    description:
                      "Grammatical details: case, tense, person, number, mood, etc. — null if not applicable",
                  },
                },
                required: [
                  "word",
                  "wordType",
                  "baseForm",
                  "translation",
                  "grammaticalInfo",
                ],
                additionalProperties: false,
              },
            },
            compoundExpressions: {
              type: "array",
              description:
                "Multi-word idiomatic or fixed expressions better understood as a unit",
              items: {
                type: "object",
                properties: {
                  expression: {
                    type: "string",
                    description: "The original Estonian expression",
                  },
                  translation: {
                    type: "string",
                    description: "English translation of the expression",
                  },
                  explanation: {
                    type: "string",
                    description:
                      "Why this is idiomatic and how the components combine",
                  },
                },
                required: ["expression", "translation", "explanation"],
                additionalProperties: false,
              },
            },
          },
          required: ["fullTranslation", "words", "compoundExpressions"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = JSON.parse(response.content[0].text) as {
    fullTranslation: string;
    words: Array<{
      word: string;
      wordType: string;
      baseForm: string | null;
      translation: string;
      grammaticalInfo: string | null;
    }>;
    compoundExpressions: Array<{
      expression: string;
      translation: string;
      explanation: string;
    }>;
  };

  return {
    id: crypto.randomUUID(),
    originalText: text,
    fullTranslation: raw.fullTranslation,
    words: raw.words.map((w) => ({
      ...w,
      baseForm: w.baseForm === "null" ? null : w.baseForm,
      grammaticalInfo: w.grammaticalInfo === "null" ? null : w.grammaticalInfo,
    })),
    compoundExpressions: raw.compoundExpressions,
    createdAt: Date.now(),
  };
}

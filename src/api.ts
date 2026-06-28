import OpenAI from "openai";
import type { AnalysisEntry } from "./types";

const SYSTEM_PROMPT = `You are an expert in Estonian linguistics and translation. When given Estonian text (a word, expression, or sentence), you will:
1. Provide a complete, natural English translation of the entire input
2. Break down each word with its English translation and relevant grammatical information (case, tense, person, number, mood, voice, etc.)
3. Identify any idiomatic or compound expressions that are best understood as a unit rather than word by word

For grammaticalInfo, be specific and concise — for example: "genitive singular", "3rd person singular present", "past participle". Use null only for words that carry no grammatical inflection (e.g. interjections, conjunctions, uninflected particles).
For baseForm: if grammaticalInfo is non-null (i.e. the word is inflected in any way), you MUST provide the base form — the dictionary/nominative singular form for nouns, adjectives, and pronouns (including compound and reciprocal pronouns), or the ma-infinitive for verbs. Use null only when the word already appears in its base form and grammaticalInfo is null.`;

export async function analyzeEstonian(
  text: string,
  apiKey: string,
): Promise<AnalysisEntry> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "analyze_estonian",
        strict: true,
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
                    description:
                      "The word as it appears in the original text",
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
                required: ["word", "baseForm", "translation", "grammaticalInfo"],
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
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content!) as {
    fullTranslation: string;
    words: Array<{
      word: string;
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
    words: raw.words,
    compoundExpressions: raw.compoundExpressions,
    createdAt: Date.now(),
  };
}

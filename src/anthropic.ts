import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisEntry } from "./types";

const SYSTEM_PROMPT = `You are an expert in Estonian linguistics and translation. When given Estonian text (a word, expression, or sentence), you will:
1. Provide a complete, natural English translation of the entire input
2. Break down each word with its English translation and relevant grammatical information (case, tense, person, number, mood, voice, etc.)
3. Identify any idiomatic or compound expressions that are best understood as a unit rather than word by word

For grammatical info, be specific and concise — for example: "genitive singular", "3rd person singular present", "past participle". Omit if not applicable (e.g. for interjections or particles with no inflection).
For baseForm, provide the dictionary/nominative form if the word appears in an inflected form. Omit if already in base form.`;

export async function analyzeEstonian(
  text: string,
  apiKey: string,
): Promise<AnalysisEntry> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "analyze_estonian",
        description:
          "Return a structured linguistic analysis of the given Estonian text",
        input_schema: {
          type: "object" as const,
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
                  baseForm: {
                    type: "string",
                    description:
                      "Dictionary/nominative form — omit if word is already in base form",
                  },
                  translation: {
                    type: "string",
                    description: "English translation of this word in context",
                  },
                  grammaticalInfo: {
                    type: "string",
                    description:
                      "Grammatical details: case, tense, person, number, mood, etc. — omit if not applicable",
                  },
                },
                required: ["word", "translation"],
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
              },
            },
          },
          required: ["fullTranslation", "words", "compoundExpressions"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "analyze_estonian" },
    messages: [{ role: "user", content: text }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Unexpected response format from API");
  }

  const input = toolUse.input as {
    fullTranslation: string;
    words: Array<{
      word: string;
      baseForm?: string;
      translation: string;
      grammaticalInfo?: string;
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
    fullTranslation: input.fullTranslation,
    words: input.words,
    compoundExpressions: input.compoundExpressions,
    createdAt: Date.now(),
  };
}

import OpenAI from "openai";
import type { PracticeAttempt, CorrectVersion } from "./types";

export async function generateSentence(
  theme: string,
  previousSentences: string[],
  apiKey: string,
): Promise<string> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const avoidClause =
    previousSentences.length > 0
      ? `\n\nDo NOT use or closely paraphrase any of these previously generated sentences:\n${previousSentences.map((s) => `- ${s}`).join("\n")}`
      : "";

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "generate_sentence",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sentence: {
              type: "string",
              description: "The generated English sentence",
            },
          },
          required: ["sentence"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `You are an Estonian language teacher creating translation practice exercises. Generate a single short, natural English sentence based on the given theme.

Requirements:
- Short: 6 to 12 words
- Only use the most common, everyday verbs: go, come, eat, drink, see, hear, say, want, need, like, love, take, give, buy, sell, know, think, feel, get, put, make, do, have, be, walk, run, sit, stand, wait, call, ask, tell, look, work, play, sleep, open, close, stop, start, help, try, etc. Avoid any verb that feels unusual, literary, or descriptive (e.g. never use: dart, nibble, gaze, linger, wander, clutch, murmur, tremble, peer, glance, crouch, slumber, stride, shudder, gleam, etc.)
- Concrete and visual — describe real actions, objects, or feelings
- Grammatically simple: one or two clauses at most
- Natural spoken or written English, not academic

Good examples: "The cat ran out of the house.", "You have the most beautiful eyes I've ever seen.", "They recognized each other right away.", "She forgot her keys on the kitchen table.", "He drinks coffee every morning.", "We need to buy some bread."
Bad examples (unusual verbs): "The fox darts away into the bushes.", "She nibbles on a piece of bread.", "He gazes at the horizon."${avoidClause}`,
      },
      { role: "user", content: `Theme: ${theme}` },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content!) as {
    sentence: string;
  };
  return raw.sentence;
}

export async function evaluateTranslation(
  englishSentence: string,
  userTranslation: string,
  apiKey: string,
): Promise<Omit<PracticeAttempt, "userTranslation">> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "evaluate_translation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            isCorrect: {
              type: "boolean",
              description:
                "True only if the translation has zero meaningful mistakes and sounds natural",
            },
            isUnderstandable: {
              type: "boolean",
              description:
                "The meaning is clear despite possible errors",
            },
            isGrammaticallyCorrect: {
              type: "boolean",
              description: "No grammatical errors in Estonian",
            },
            isNatural: {
              type: "boolean",
              description: "Sounds like natural, idiomatic Estonian",
            },
            mistakes: {
              type: "array",
              description: "List of specific mistakes found, empty if none",
              items: {
                type: "object",
                properties: {
                  issue: {
                    type: "string",
                    description: "Clear description of the problem",
                  },
                  suggestion: {
                    type: "string",
                    description: "The corrected form or wording",
                  },
                },
                required: ["issue", "suggestion"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "isCorrect",
            "isUnderstandable",
            "isGrammaticallyCorrect",
            "isNatural",
            "mistakes",
          ],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "system",
        content:
          "You are an expert Estonian linguistics teacher. Evaluate the student's Estonian translation of the given English sentence. Be precise: isCorrect must be true only if there are zero meaningful mistakes. List every error clearly with a concrete suggestion for correction.",
      },
      {
        role: "user",
        content: `English sentence: "${englishSentence}"\nStudent's Estonian translation: "${userTranslation}"`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as Omit<
    PracticeAttempt,
    "userTranslation"
  >;
}

export async function getCorrectVersions(
  englishSentence: string,
  apiKey: string,
): Promise<CorrectVersion[]> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "correct_versions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            versions: {
              type: "array",
              description: "2 to 3 correct Estonian translations",
              items: {
                type: "object",
                properties: {
                  translation: {
                    type: "string",
                    description: "A correct Estonian translation",
                  },
                  commentary: {
                    type: "string",
                    description:
                      "Notes on style, register, naturalness, or how it differs from other versions",
                  },
                },
                required: ["translation", "commentary"],
                additionalProperties: false,
              },
            },
          },
          required: ["versions"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "system",
        content:
          "You are an expert Estonian language teacher. Provide 2–3 correct Estonian translations of the given English sentence, covering different styles or registers where meaningful (e.g. more formal vs. more colloquial, different word order). For each, add a short commentary explaining what makes it good, how it differs from the others, or any nuance worth noting.",
      },
      { role: "user", content: englishSentence },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content!) as {
    versions: CorrectVersion[];
  };
  return raw.versions;
}

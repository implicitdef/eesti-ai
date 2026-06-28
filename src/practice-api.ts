import OpenAI from "openai";
import type { PracticeAttempt, CorrectVersion } from "./types";

function formatAcceptedVersions(versions: CorrectVersion[]): string {
  if (versions.length === 0) return "";
  return (
    "\n\nPre-validated correct translations (reference — not exhaustive):\n" +
    versions.map((v, i) => `${i + 1}. ${v.translation}`).join("\n")
  );
}

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
  acceptedVersions: CorrectVersion[],
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
                "True if the translation is correct and natural — even if it differs from the pre-validated versions",
            },
            isUnderstandable: {
              type: "boolean",
              description: "The meaning is clear despite possible errors",
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
          `You are an expert Estonian linguistics teacher evaluating a student's translation. Follow these rules strictly:

1. LENIENCY: Accept ANY correct, natural Estonian translation — there are many valid ways to express the same sentence. Do NOT penalise valid alternative phrasings, word choices, or word orders.
2. REAL ERRORS ONLY: Only flag genuine mistakes — wrong grammatical case, wrong word form, a word that loses or distorts the meaning, or clearly unnatural phrasing that a native speaker would not say.
3. CONSISTENCY: If the student is not yet correct, identify which pre-validated version they are closest to, and give feedback nudging them toward THAT specific version — not toward a different target than previous hints.
4. DO NOT invent new "correct" targets that differ from the pre-validated versions when giving suggestions.${formatAcceptedVersions(acceptedVersions)}`,
      },
      {
        role: "user",
        content: `English: "${englishSentence}"\nStudent's Estonian: "${userTranslation}"`,
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
          "You are an expert Estonian language teacher. Generate 4–5 correct Estonian translations of the given English sentence, covering the full range of natural phrasings — different word orders, vocabulary choices, and registers (formal/colloquial). Be inclusive: capture all the common ways a fluent speaker might naturally say this. These serve as reference answers for evaluating student work, so err on the side of breadth. For each, add a short commentary on its style or how it differs from the others.",
      },
      { role: "user", content: englishSentence },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content!) as {
    versions: CorrectVersion[];
  };
  return raw.versions;
}

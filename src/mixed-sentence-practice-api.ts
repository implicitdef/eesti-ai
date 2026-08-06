import Anthropic from "@anthropic-ai/sdk";
import { avoidRepeatsNote, MODEL, responseText } from "./anthropic-response";
import {
  fixSentenceIfNeeded,
  translateToEnglish,
} from "./sentence-practice-api";

export interface MixedSentenceResult {
  sentence: string;
  englishTranslation: string;
}

async function createSentenceFromInputs(
  inputSentences: string,
  apiKey: string,
  previousSentences: string[],
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are an expert Estonian language teacher preparing a back-translation exercise.

You will be given several Estonian sentences below. They may be unrelated to each other. Write ONE new Estonian sentence at approximately B1 level, reusing vocabulary from the given sentences as much as possible — both single words and idioms/expressions — treating them as building blocks (structures, expressions, words) you can draw from. You do not need to reuse all of the vocabulary, since you are producing only one sentence; just reuse as much as fits naturally into a coherent sentence.
It's best if your final sentence doesn't look a copy/paste of the clauses of the original sentences. Mix them up, and you may play also with tenses, affirmative/negative, singular plural, etc.
The final sentence MUST always be grammatically correct and natural Estonian.
${avoidRepeatsNote(previousSentences)}`,
    messages: [
      { role: "user", content: `Estonian sentences:\n${inputSentences}` },
    ],
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

export async function generateMixedSentence(
  inputSentences: string,
  apiKey: string,
  previousSentences: string[] = [],
): Promise<MixedSentenceResult> {
  const rawSentence = await createSentenceFromInputs(
    inputSentences,
    apiKey,
    previousSentences,
  );
  const sentence = await fixSentenceIfNeeded(rawSentence, apiKey);
  const englishTranslation = await translateToEnglish(sentence, apiKey);
  return { sentence, englishTranslation };
}

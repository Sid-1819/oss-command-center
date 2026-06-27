import { genAI } from "@/lib/ai";
import {
  buildReadmeActionPrompt,
  README_ACTION_SYSTEM_INSTRUCTION,
} from "@/lib/ai/readme-action-prompt";
import {
  ReadmeActionError,
  readmeExecutionPlanSchema,
  type ReadmePlanPayload,
} from "@/actions/readme/types";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";
import { ApiError } from "@google/genai";
import { toJSONSchema } from "zod";

const README_PLAN_MODEL = "gemini-2.5-flash";
const MAX_ATTEMPTS = 2;

const INVALID_JSON_CORRECTION =
  "Your previous response was invalid JSON. Return only valid JSON matching the schema.";

type ParseResult =
  | { success: true; data: ReadmePlanPayload }
  | { success: false; reason: "empty" | "json" | "validation" };

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function parseReadmePlanResponse(text: string | undefined): ParseResult {
  if (!text?.trim()) {
    return { success: false, reason: "empty" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripMarkdownFences(text));
  } catch {
    return { success: false, reason: "json" };
  }

  const validation = readmeExecutionPlanSchema.safeParse(parsed);

  if (!validation.success) {
    return { success: false, reason: "validation" };
  }

  return { success: true, data: validation.data };
}

async function requestReadmePlan(input: {
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentReadme: string;
  correction?: string;
}): Promise<string> {
  const response = await genAI.models.generateContent({
    model: README_PLAN_MODEL,
    contents: buildReadmeActionPrompt(input),
    config: {
      systemInstruction: README_ACTION_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: toJSONSchema(readmeExecutionPlanSchema),
    },
  });

  return response.text ?? "";
}

function toReadmeActionError(error: unknown): never {
  if (error instanceof ReadmeActionError) {
    throw error;
  }

  if (error instanceof ApiError) {
    throw new ReadmeActionError(
      error.message || "Failed to generate README action plan",
      "AI_ERROR",
      error.status ?? 500,
    );
  }

  throw new ReadmeActionError(
    "Failed to generate README action plan",
    "AI_ERROR",
    500,
  );
}

export async function generateReadmePlanFromContext(input: {
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentReadme: string;
}): Promise<ReadmePlanPayload> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new ReadmeActionError(
      "GOOGLE_API_KEY is not configured",
      "MISSING_API_KEY",
      500,
    );
  }

  let lastFailure: ParseResult = { success: false, reason: "empty" };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const responseText = await requestReadmePlan({
        ...input,
        correction: attempt === 1 ? INVALID_JSON_CORRECTION : undefined,
      });
      const result = parseReadmePlanResponse(responseText);

      if (result.success) {
        return result.data;
      }

      lastFailure = result;
    } catch (error) {
      toReadmeActionError(error);
    }
  }

  if (lastFailure.reason === "validation") {
    throw new ReadmeActionError(
      "README action plan failed schema validation",
      "VALIDATION",
      422,
    );
  }

  throw new ReadmeActionError(
    "README action plan response was empty or invalid",
    "INVALID_RESPONSE",
    502,
  );
}

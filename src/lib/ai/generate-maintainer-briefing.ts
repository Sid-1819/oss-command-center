import { genAI } from "@/lib/ai";
import {
  buildMaintainerBriefingPrompt,
  MAINTAINER_BRIEFING_SYSTEM_INSTRUCTION,
} from "@/lib/ai/maintainer-briefing-prompt";
import type { RepositoryAnalysis } from "@/types/repository-analysis";
import {
  GenerateMaintainerBriefingError,
  maintainerBriefingSchema,
  type MaintainerBriefing,
} from "@/types/maintainer-briefing";
import { ApiError } from "@google/genai";
import { toJSONSchema } from "zod";

const BRIEFING_MODEL = "gemini-2.5-flash";
const MAX_ATTEMPTS = 2;

const INVALID_JSON_CORRECTION =
  "Your previous response was invalid JSON. Return only valid JSON matching the schema.";

type ParseResult =
  | { success: true; data: MaintainerBriefing }
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

function parseBriefingResponse(text: string | undefined): ParseResult {
  if (!text?.trim()) {
    return { success: false, reason: "empty" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripMarkdownFences(text));
  } catch {
    return { success: false, reason: "json" };
  }

  const validation = maintainerBriefingSchema.safeParse(parsed);

  if (!validation.success) {
    return { success: false, reason: "validation" };
  }

  return { success: true, data: validation.data };
}

async function requestBriefing(
  analysis: RepositoryAnalysis,
  correction?: string,
): Promise<string> {
  const response = await genAI.models.generateContent({
    model: BRIEFING_MODEL,
    contents: buildMaintainerBriefingPrompt(analysis, correction),
    config: {
      systemInstruction: MAINTAINER_BRIEFING_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: toJSONSchema(maintainerBriefingSchema),
    },
  });

  return response.text ?? "";
}

function toGenerateMaintainerBriefingError(error: unknown): never {
  if (error instanceof GenerateMaintainerBriefingError) {
    throw error;
  }

  if (error instanceof ApiError) {
    throw new GenerateMaintainerBriefingError(
      error.message || "Failed to generate maintainer briefing",
      "AI_ERROR",
      error.status ?? 500,
    );
  }

  throw new GenerateMaintainerBriefingError(
    "Failed to generate maintainer briefing",
    "AI_ERROR",
    500,
  );
}

export async function generateMaintainerBriefingFromAnalysis(
  analysis: RepositoryAnalysis,
): Promise<MaintainerBriefing> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new GenerateMaintainerBriefingError(
      "GOOGLE_API_KEY is not configured",
      "MISSING_API_KEY",
      500,
    );
  }

  let lastFailure: ParseResult = { success: false, reason: "empty" };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const responseText = await requestBriefing(
        analysis,
        attempt === 1 ? INVALID_JSON_CORRECTION : undefined,
      );
      const result = parseBriefingResponse(responseText);

      if (result.success) {
        return result.data;
      }

      lastFailure = result;
    } catch (error) {
      toGenerateMaintainerBriefingError(error);
    }
  }

  if (lastFailure.reason === "validation") {
    throw new GenerateMaintainerBriefingError(
      "Maintainer briefing response failed schema validation",
      "VALIDATION",
      422,
    );
  }

  throw new GenerateMaintainerBriefingError(
    "Maintainer briefing response was empty or invalid",
    "INVALID_RESPONSE",
    502,
  );
}

import {
  buildMarkdownDocActionPrompt,
  buildMarkdownDocSystemInstruction,
} from "@/lib/ai/markdown-doc-prompt";
import { hashAnalysisSnapshot, hashContent } from "@/lib/ai/cache";
import { generateStructuredJson } from "@/lib/ai/generate-structured";
import type { AiRequestConfig } from "@/lib/ai/types";
import {
  MarkdownDocActionError,
  markdownDocExecutionPlanSchema,
  type MarkdownDocPlanPayload,
} from "@/actions/markdown-doc/types";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";
import { AiConfigError } from "@/lib/ai/types";

const PLAN_MODEL = "gemini-2.5-flash";

function toActionError(error: AiConfigError): never {
  throw new MarkdownDocActionError(error.message, error.code, error.status);
}

export async function generateMarkdownDocPlanFromContext(input: {
  targetFile: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentContent: string;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
}): Promise<MarkdownDocPlanPayload> {
  return generateStructuredJson<MarkdownDocPlanPayload>({
    aiConfig: input.aiConfig,
    forceRefresh: input.forceRefresh,
    cacheInputs: {
      analysisHash: hashAnalysisSnapshot(input.analysis),
      targetFile: input.targetFile,
      suggestion: input.suggestion.trim(),
      contentHash: hashContent(input.currentContent),
    },
    request: {
      operation: "markdown-doc-plan",
      systemInstruction: buildMarkdownDocSystemInstruction(input.targetFile),
      userPrompt: buildMarkdownDocActionPrompt(input),
      schema: markdownDocExecutionPlanSchema,
      modelDefault: PLAN_MODEL,
    },
    onError: toActionError,
    onInvalidResponse: (reason) => {
      throw new MarkdownDocActionError(
        reason === "validation"
          ? "Markdown doc action plan failed schema validation"
          : "Markdown doc action plan response was empty or invalid",
        reason === "validation" ? "VALIDATION" : "INVALID_RESPONSE",
        reason === "validation" ? 422 : 502,
      );
    },
  });
}

export async function generateReadmePlanFromContext(input: {
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentReadme: string;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
}): Promise<MarkdownDocPlanPayload> {
  return generateMarkdownDocPlanFromContext({
    targetFile: "README.md",
    ...input,
    currentContent: input.currentReadme,
  });
}

import {
  buildIssueFixActionPrompt,
  ISSUE_FIX_SYSTEM_INSTRUCTION,
} from "@/lib/ai/issue-fix-prompt";
import { hashAnalysisSnapshot, hashContent } from "@/lib/ai/cache";
import { generateStructuredJson } from "@/lib/ai/generate-structured";
import type { AiRequestConfig } from "@/lib/ai/types";
import {
  IssueFixActionError,
  issueFixExecutionPlanSchema,
  type IssueFixPlanPayload,
} from "@/actions/issue-fix/types";
import type { AutoFixCandidate } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";
import { AiConfigError } from "@/lib/ai/types";

const PLAN_MODEL = "gemini-2.5-flash";

function toActionError(error: AiConfigError): never {
  throw new IssueFixActionError(error.message, error.code, error.status);
}

export async function generateIssueFixPlanFromContext(input: {
  issueNumber: number;
  issueTitle: string;
  issueBody?: string;
  candidate: AutoFixCandidate;
  targetFile: string;
  analysis: RepositoryAnalysis;
  currentContent: string;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
}): Promise<IssueFixPlanPayload> {
  return generateStructuredJson<IssueFixPlanPayload>({
    aiConfig: input.aiConfig,
    forceRefresh: input.forceRefresh,
    cacheInputs: {
      analysisHash: hashAnalysisSnapshot(input.analysis),
      issueNumber: input.issueNumber,
      targetFile: input.targetFile,
      contentHash: hashContent(input.currentContent),
    },
    request: {
      operation: "issue-fix-plan",
      systemInstruction: ISSUE_FIX_SYSTEM_INSTRUCTION,
      userPrompt: buildIssueFixActionPrompt(input),
      schema: issueFixExecutionPlanSchema,
      modelDefault: PLAN_MODEL,
    },
    onError: toActionError,
    onInvalidResponse: (reason) => {
      throw new IssueFixActionError(
        reason === "validation" ? "Plan failed validation" : "Invalid AI response",
        reason === "validation" ? "VALIDATION" : "INVALID_RESPONSE",
        reason === "validation" ? 422 : 502,
      );
    },
  });
}

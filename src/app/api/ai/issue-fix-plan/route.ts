import { z } from "zod";
import {
  buildIssueFixActionPrompt,
  ISSUE_FIX_SYSTEM_INSTRUCTION,
} from "@/lib/ai/issue-fix-prompt";
import { hashAnalysisSnapshot, hashContent } from "@/lib/ai/cache";
import { aiConfigSchema, handleAiStreamRoute } from "@/lib/ai/api-route";
import { issueFixExecutionPlanSchema } from "@/actions/issue-fix/types";
import type { AutoFixCandidate } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

const requestSchema = z.object({
  issueNumber: z.number(),
  issueTitle: z.string(),
  issueBody: z.string().optional(),
  candidate: z.custom<AutoFixCandidate>(),
  targetFile: z.string(),
  analysis: z.custom<RepositoryAnalysis>(),
  currentContent: z.string(),
  aiConfig: aiConfigSchema,
  forceRefresh: z.boolean().optional(),
  demoMode: z.boolean().optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Invalid request body.", code: "VALIDATION" },
      { status: 400 },
    );
  }

  return handleAiStreamRoute({
    operation: "issue-fix-plan",
    aiConfig: body.aiConfig,
    forceRefresh: body.forceRefresh,
    demoMode: body.demoMode,
    cacheInputs: {
      analysisHash: hashAnalysisSnapshot(body.analysis),
      issueNumber: body.issueNumber,
      targetFile: body.targetFile,
      contentHash: hashContent(body.currentContent),
    },
    system: ISSUE_FIX_SYSTEM_INSTRUCTION,
    prompt: buildIssueFixActionPrompt(body),
    schema: issueFixExecutionPlanSchema,
  });
}

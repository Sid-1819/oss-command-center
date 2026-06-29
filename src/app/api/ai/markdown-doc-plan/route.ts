import { z } from "zod";
import {
  buildMarkdownDocActionPrompt,
  buildMarkdownDocSystemInstruction,
} from "@/lib/ai/markdown-doc-prompt";
import { hashAnalysisSnapshot, hashContent } from "@/lib/ai/cache";
import { aiConfigSchema, handleAiStreamRoute } from "@/lib/ai/api-route";
import { markdownDocExecutionPlanSchema } from "@/actions/markdown-doc/types";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

const requestSchema = z.object({
  targetFile: z.string(),
  analysis: z.custom<RepositoryAnalysis>(),
  briefing: z.custom<MaintainerBriefing>(),
  suggestion: z.string(),
  currentContent: z.string(),
  aiConfig: aiConfigSchema,
  forceRefresh: z.boolean().optional(),
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

  if (!body.suggestion.trim()) {
    return Response.json(
      { error: "A documentation suggestion is required.", code: "VALIDATION" },
      { status: 400 },
    );
  }

  return handleAiStreamRoute({
    operation: "markdown-doc-plan",
    aiConfig: body.aiConfig,
    forceRefresh: body.forceRefresh,
    cacheInputs: {
      analysisHash: hashAnalysisSnapshot(body.analysis),
      targetFile: body.targetFile,
      suggestion: body.suggestion.trim(),
      contentHash: hashContent(body.currentContent),
    },
    system: buildMarkdownDocSystemInstruction(body.targetFile),
    prompt: buildMarkdownDocActionPrompt({
      targetFile: body.targetFile,
      analysis: body.analysis,
      briefing: body.briefing,
      suggestion: body.suggestion,
      currentContent: body.currentContent,
    }),
    schema: markdownDocExecutionPlanSchema,
  });
}

import { z } from "zod";
import {
  buildMaintainerBriefingPrompt,
  MAINTAINER_BRIEFING_SYSTEM_INSTRUCTION,
} from "@/lib/ai/maintainer-briefing-prompt";
import { hashAnalysisSnapshot } from "@/lib/ai/cache";
import { aiConfigSchema, handleAiStreamRoute } from "@/lib/ai/api-route";
import { maintainerBriefingSchema } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

const requestSchema = z.object({
  analysis: z.custom<RepositoryAnalysis>(),
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
    operation: "maintainer-briefing",
    aiConfig: body.aiConfig,
    forceRefresh: body.forceRefresh,
    demoMode: body.demoMode,
    cacheInputs: {
      analysisHash: hashAnalysisSnapshot(body.analysis),
    },
    system: MAINTAINER_BRIEFING_SYSTEM_INSTRUCTION,
    prompt: buildMaintainerBriefingPrompt(body.analysis),
    schema: maintainerBriefingSchema,
  });
}

"use server";

import { generateMaintainerBriefingFromAnalysis } from "@/lib/ai/generate-maintainer-briefing";
import type { AiRequestConfig } from "@/lib/ai/types";
import type { RepositoryAnalysis } from "@/types/repository-analysis";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";

export async function generateMaintainerBriefing(
  analysis: RepositoryAnalysis,
  options?: {
    aiConfig?: AiRequestConfig;
    forceRefresh?: boolean;
  },
): Promise<MaintainerBriefing> {
  return generateMaintainerBriefingFromAnalysis(analysis, options);
}

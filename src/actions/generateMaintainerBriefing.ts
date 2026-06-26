"use server";

import { generateMaintainerBriefingFromAnalysis } from "@/lib/ai/generate-maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";

export async function generateMaintainerBriefing(
  analysis: RepositoryAnalysis,
): Promise<MaintainerBriefing> {
  return generateMaintainerBriefingFromAnalysis(analysis);
}

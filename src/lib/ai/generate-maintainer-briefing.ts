import {
  buildMaintainerBriefingPrompt,
  MAINTAINER_BRIEFING_SYSTEM_INSTRUCTION,
} from "@/lib/ai/maintainer-briefing-prompt";
import { hashAnalysisSnapshot } from "@/lib/ai/cache";
import { generateStructuredJson } from "@/lib/ai/generate-structured";
import type { AiRequestConfig } from "@/lib/ai/types";
import type { RepositoryAnalysis } from "@/types/repository-analysis";
import {
  GenerateMaintainerBriefingError,
  maintainerBriefingSchema,
  type MaintainerBriefing,
} from "@/types/maintainer-briefing";
import { normalizeBriefing } from "@/lib/maintainer-briefing-utils";
import { AiConfigError } from "@/lib/ai/types";

const BRIEFING_MODEL = "gemini-2.5-flash";

function toBriefingError(error: AiConfigError): never {
  throw new GenerateMaintainerBriefingError(error.message, error.code, error.status);
}

export async function generateMaintainerBriefingFromAnalysis(
  analysis: RepositoryAnalysis,
  options?: {
    aiConfig?: AiRequestConfig;
    forceRefresh?: boolean;
  },
): Promise<MaintainerBriefing> {
  const data = await generateStructuredJson<MaintainerBriefing>({
    aiConfig: options?.aiConfig,
    forceRefresh: options?.forceRefresh,
    cacheInputs: {
      analysisHash: hashAnalysisSnapshot(analysis),
    },
    request: {
      operation: "maintainer-briefing",
      systemInstruction: MAINTAINER_BRIEFING_SYSTEM_INSTRUCTION,
      userPrompt: buildMaintainerBriefingPrompt(analysis),
      schema: maintainerBriefingSchema,
      modelDefault: BRIEFING_MODEL,
    },
    onError: toBriefingError,
    onInvalidResponse: (reason) => {
      throw new GenerateMaintainerBriefingError(
        reason === "validation"
          ? "Maintainer briefing response failed schema validation"
          : "Maintainer briefing response was empty or invalid",
        reason === "validation" ? "VALIDATION" : "INVALID_RESPONSE",
        reason === "validation" ? 422 : 502,
      );
    },
  });

  return normalizeBriefing(data);
}

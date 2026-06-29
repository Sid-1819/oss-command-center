"use server";

import { analyzeRepository } from "@/actions/analyzeRepository";
import { generateMaintainerBriefing } from "@/actions/generateMaintainerBriefing";
import { trimAnalysisForClient } from "@/lib/repository-analysis-utils";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type { AiRequestConfig } from "@/lib/ai/types";
import type { DashboardAnalysisResult } from "@/types/dashboard-analysis";
import { AnalyzeRepositoryError } from "@/types/repository-analysis";
import { GenerateMaintainerBriefingError } from "@/types/maintainer-briefing";

export interface AnalyzeRepositoryDashboardInput {
  repositoryRef: string;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
}

export async function analyzeRepositoryDashboard(
  input: AnalyzeRepositoryDashboardInput | string,
): Promise<DashboardAnalysisResult> {
  const params: AnalyzeRepositoryDashboardInput =
    typeof input === "string" ? { repositoryRef: input } : input;

  const parsed = parseRepositoryRef(params.repositoryRef);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: parsed.message,
        code: "VALIDATION",
        status: 400,
      },
    };
  }

  let analysis;

  try {
    analysis = await analyzeRepository(parsed.owner, parsed.repo);
  } catch (error) {
    if (error instanceof AnalyzeRepositoryError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          status: error.status,
        },
      };
    }

    return {
      success: false,
      error: {
        message: `Failed to analyze repository ${parsed.repositoryRef}`,
        code: "UNKNOWN",
        status: 500,
      },
    };
  }

  try {
    const briefing = await generateMaintainerBriefing(analysis, {
      aiConfig: params.aiConfig,
      forceRefresh: params.forceRefresh,
    });

    return {
      success: true,
      analysis: trimAnalysisForClient(analysis, briefing),
      briefing,
      analyzedAt: new Date().toISOString(),
      repositoryRef: parsed.repositoryRef,
    };
  } catch (error) {
    if (error instanceof GenerateMaintainerBriefingError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          status: error.status,
        },
      };
    }

    return {
      success: false,
      error: {
        message: "Failed to generate maintainer briefing",
        code: "AI_ERROR",
        status: 500,
      },
    };
  }
}

"use server";

import { analyzeRepository } from "@/actions/analyzeRepository";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import { AnalyzeRepositoryError } from "@/types/repository-analysis";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export type FetchRepositoryAnalysisResult =
  | { success: true; analysis: RepositoryAnalysis; repositoryRef: string }
  | {
      success: false;
      error: { message: string; code: string; status: number };
    };

export async function fetchRepositoryAnalysisAction(
  repositoryRef: string,
): Promise<FetchRepositoryAnalysisResult> {
  const parsed = parseRepositoryRef(repositoryRef);

  if (!parsed.success) {
    return {
      success: false,
      error: { message: parsed.message, code: "VALIDATION", status: 400 },
    };
  }

  try {
    const analysis = await analyzeRepository(parsed.owner, parsed.repo);

    return {
      success: true,
      analysis,
      repositoryRef: parsed.repositoryRef,
    };
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
}

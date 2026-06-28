"use server";

import {
  DEFAULT_README_FIXTURE,
  isAllowedDocFile,
} from "@/actions/markdown-doc/types";
import { AuthError, requireSession } from "@/lib/auth";
import { getFileContents } from "@/lib/github/contents";
import { GitHubServiceError } from "@/lib/github/errors";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type { PlanMarkdownDocActionInput } from "@/types/doc-plan-review";

const DEMO_FILE_SHA = "demo-file-sha";

export type PrepareMarkdownDocPlanResult =
  | {
      success: true;
      repositoryRef: string;
      targetFile: string;
      suggestion: string;
      analysis: PlanMarkdownDocActionInput["analysis"];
      briefing: PlanMarkdownDocActionInput["briefing"];
      currentContent: string;
      sourceSha: string;
      aiConfig?: PlanMarkdownDocActionInput["aiConfig"];
      demoMode?: boolean;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        status?: number;
      };
    };

export async function prepareMarkdownDocPlanAction(
  input: PlanMarkdownDocActionInput,
): Promise<PrepareMarkdownDocPlanResult> {
  const parsed = parseRepositoryRef(input.repositoryRef);

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION", message: parsed.message, status: 400 },
    };
  }

  if (!input.suggestion.trim()) {
    return {
      success: false,
      error: {
        code: "VALIDATION",
        message: "A documentation suggestion is required.",
        status: 400,
      },
    };
  }

  if (!isAllowedDocFile(input.targetFile)) {
    return {
      success: false,
      error: {
        code: "VALIDATION",
        message: `Target file "${input.targetFile}" is not supported.`,
        status: 400,
      },
    };
  }

  let fileContent: string;
  let fileSha: string;

  if (input.demoMode) {
    fileContent =
      input.targetFile.toLowerCase() === "readme.md"
        ? DEFAULT_README_FIXTURE
        : `# ${input.targetFile}\n\nDemo fixture content.\n`;
    fileSha = DEMO_FILE_SHA;
  } else {
    try {
      const session = await requireSession();
      const file = await getFileContents({
        accessToken: session.accessToken,
        owner: parsed.owner,
        repo: parsed.repo,
        path: input.targetFile,
        ref: input.analysis.repository.defaultBranch,
      });

      fileContent = file.content;
      fileSha = file.sha;
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          success: false,
          error: { code: "EXPIRED_SESSION", message: error.message, status: 401 },
        };
      }

      if (error instanceof GitHubServiceError) {
        return {
          success: false,
          error: { code: "GITHUB_FETCH", message: error.message, status: error.status },
        };
      }

      return {
        success: false,
        error: {
          code: "GITHUB_FETCH",
          message: `Failed to fetch ${input.targetFile}`,
          status: 500,
        },
      };
    }
  }

  return {
    success: true,
    repositoryRef: parsed.repositoryRef,
    targetFile: input.targetFile,
    suggestion: input.suggestion.trim(),
    analysis: input.analysis,
    briefing: input.briefing,
    currentContent: fileContent,
    sourceSha: fileSha,
    aiConfig: input.aiConfig ?? (input.demoMode ? { provider: "mock" } : undefined),
    demoMode: input.demoMode,
  };
}

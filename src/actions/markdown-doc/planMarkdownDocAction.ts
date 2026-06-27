"use server";

import type { ValidationResult } from "@/actions/core/types";
import {
  applyMarkdownDocPlan,
  buildPreviewDiff,
} from "@/actions/markdown-doc/apply-plan";
import { markdownDocPlanner } from "@/actions/markdown-doc/planner";
import {
  DEFAULT_README_FIXTURE,
  isAllowedDocFile,
  MarkdownDocActionError,
} from "@/actions/markdown-doc/types";
import { markdownDocValidator } from "@/actions/markdown-doc/validator";
import { mapGeminiApiError } from "@/lib/ai/gemini-errors";
import { AuthError, requireSession } from "@/lib/auth";
import { getFileContents } from "@/lib/github/contents";
import { GitHubServiceError } from "@/lib/github/errors";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type {
  PlanMarkdownDocActionInput,
  PlanMarkdownDocActionResult,
} from "@/types/doc-plan-review";

const DEMO_FILE_SHA = "demo-file-sha";

export async function planMarkdownDocAction(
  input: PlanMarkdownDocActionInput,
): Promise<PlanMarkdownDocActionResult> {
  const parsed = parseRepositoryRef(input.repositoryRef);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION",
        message: parsed.message,
        status: 400,
      },
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
    let session;

    try {
      session = await requireSession();
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          success: false,
          error: {
            code: "EXPIRED_SESSION",
            message: error.message,
            status: 401,
          },
        };
      }

      return {
        success: false,
        error: {
          code: "UNKNOWN",
          message: "Failed to verify session.",
          status: 500,
        },
      };
    }

    try {
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
      if (error instanceof GitHubServiceError) {
        return {
          success: false,
          error: {
            code: "GITHUB_FETCH",
            message: error.message,
            status: error.status,
          },
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

  let plan;

  try {
    plan = await markdownDocPlanner.plan({
      repositoryRef: parsed.repositoryRef,
      targetFile: input.targetFile,
      analysis: input.analysis,
      briefing: input.briefing,
      suggestion: input.suggestion.trim(),
      currentContent: fileContent,
      sourceSha: fileSha,
      aiConfig: input.aiConfig ?? (input.demoMode ? { provider: "mock" } : undefined),
      forceRefresh: input.forceRefresh,
      demoMode: input.demoMode,
    });
  } catch (error) {
    if (error instanceof MarkdownDocActionError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          status: error.status,
        },
      };
    }

    const geminiError = mapGeminiApiError(error);

    if (geminiError) {
      return {
        success: false,
        error: {
          code: geminiError.code,
          message: geminiError.message,
          status: geminiError.status,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "AI_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate documentation update plan.",
        status: 500,
      },
    };
  }

  const validation: ValidationResult = markdownDocValidator.validate(plan);
  const preview = applyMarkdownDocPlan(fileContent, plan.steps);
  const previewDiff = buildPreviewDiff(
    input.targetFile,
    fileContent,
    preview.updatedContent,
  );

  return {
    success: true,
    plan,
    preview,
    previewDiff,
    validation,
  };
}

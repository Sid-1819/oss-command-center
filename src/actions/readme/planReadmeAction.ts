"use server";

import type { ValidationResult } from "@/actions/core/types";
import { applyReadmePlan, buildPreviewDiff } from "@/actions/readme/apply-plan";
import { readmePlanner } from "@/actions/readme/planner";
import {
  README_TARGET_FILE,
  ReadmeActionError,
} from "@/actions/readme/types";
import { readmeValidator } from "@/actions/readme/validator";
import { AuthError, requireSession } from "@/lib/auth";
import { getFileContents } from "@/lib/github/contents";
import { GitHubServiceError } from "@/lib/github/errors";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type {
  PlanReadmeActionInput,
  PlanReadmeActionResult,
} from "@/types/readme-plan-review";

export async function planReadmeAction(
  input: PlanReadmeActionInput,
): Promise<PlanReadmeActionResult> {
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

  let file;

  try {
    file = await getFileContents({
      accessToken: session.accessToken,
      owner: parsed.owner,
      repo: parsed.repo,
      path: README_TARGET_FILE,
      ref: input.analysis.repository.defaultBranch,
    });
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
        message: "Failed to fetch README.md",
        status: 500,
      },
    };
  }

  let plan;

  try {
    plan = await readmePlanner.plan({
      repositoryRef: parsed.repositoryRef,
      analysis: input.analysis,
      briefing: input.briefing,
      suggestion: input.suggestion.trim(),
      currentReadme: file.content,
      sourceSha: file.sha,
    });
  } catch (error) {
    if (error instanceof ReadmeActionError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          status: error.status,
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
            : "Failed to generate README update plan.",
        status: 500,
      },
    };
  }

  const validation: ValidationResult = readmeValidator.validate(plan);
  const preview = applyReadmePlan(file.content, plan.steps);
  const previewDiff = buildPreviewDiff(
    README_TARGET_FILE,
    file.content,
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

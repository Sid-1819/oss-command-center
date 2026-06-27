"use server";

import type { ValidationResult } from "@/actions/core/types";
import { applyIssueFixPlan, buildPreviewDiff } from "@/actions/issue-fix/apply-plan";
import { issueFixPlanner } from "@/actions/issue-fix/planner";
import { IssueFixActionError } from "@/actions/issue-fix/types";
import { issueFixValidator } from "@/actions/issue-fix/validator";
import { mapGeminiApiError } from "@/lib/ai/gemini-errors";
import { AuthError, requireSession } from "@/lib/auth";
import { getFileContents } from "@/lib/github/contents";
import { getIssue } from "@/lib/github/issues";
import { GitHubServiceError } from "@/lib/github/errors";
import { createOctokit } from "@/lib/github";
import { normalizeBriefing } from "@/lib/maintainer-briefing-utils";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type {
  PlanIssueFixActionInput,
  PlanIssueFixActionResult,
} from "@/types/doc-plan-review";

const DEMO_FILE_SHA = "demo-file-sha";
const DEMO_ISSUE_FIX_CONTENT = `# Contributing

## Development setup

Run \`npm instal example-project\` to install dependencies locally.
`;

export async function planIssueFixAction(
  input: PlanIssueFixActionInput,
): Promise<PlanIssueFixActionResult> {
  const parsed = parseRepositoryRef(input.repositoryRef);

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION", message: parsed.message, status: 400 },
    };
  }

  const briefing = normalizeBriefing(input.briefing);
  const candidate = briefing.autoFixCandidates.find(
    (item) => item.issueNumber === input.issueNumber,
  );

  if (!candidate) {
    return {
      success: false,
      error: {
        code: "VALIDATION",
        message: `Issue #${input.issueNumber} is not an auto-fix candidate.`,
        status: 400,
      },
    };
  }

  const targetFile = candidate.suggestedFiles[0];

  if (!targetFile) {
    return {
      success: false,
      error: {
        code: "VALIDATION",
        message: "Auto-fix candidate has no suggested target file.",
        status: 400,
      },
    };
  }

  let issueTitle: string;
  let issueBody: string | undefined;
  let fileContent: string;
  let fileSha: string;

  if (input.demoMode) {
    issueTitle = "Typo in CONTRIBUTING.md code sample";
    issueBody = "The npm install command in CONTRIBUTING.md has a typo.";
    fileContent = DEMO_ISSUE_FIX_CONTENT;
    fileSha = DEMO_FILE_SHA;
  } else {
    let session;

    try {
      session = await requireSession();
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          success: false,
          error: { code: "EXPIRED_SESSION", message: error.message, status: 401 },
        };
      }
      return {
        success: false,
        error: { code: "UNKNOWN", message: "Failed to verify session.", status: 500 },
      };
    }

    const octokit = createOctokit(session.accessToken);

    try {
      const issueDetails = await getIssue(octokit, {
        owner: parsed.owner,
        repo: parsed.repo,
        issueNumber: input.issueNumber,
      });

      issueTitle = issueDetails.title;
      issueBody = issueDetails.body ?? undefined;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GITHUB_FETCH",
          message: error instanceof Error ? error.message : "Failed to fetch issue.",
          status: 500,
        },
      };
    }

    try {
      const file = await getFileContents({
        accessToken: session.accessToken,
        owner: parsed.owner,
        repo: parsed.repo,
        path: targetFile,
        ref: input.analysis.repository.defaultBranch,
      });

      fileContent = file.content;
      fileSha = file.sha;
    } catch (error) {
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
          message: `Failed to fetch ${targetFile}`,
          status: 500,
        },
      };
    }
  }

  let plan;

  try {
    plan = await issueFixPlanner.plan({
      repositoryRef: parsed.repositoryRef,
      issueNumber: input.issueNumber,
      candidate,
      analysis: input.analysis,
      issueTitle,
      issueBody,
      targetFile,
      currentContent: fileContent,
      sourceSha: fileSha,
      aiConfig: input.aiConfig ?? (input.demoMode ? { provider: "mock" } : undefined),
      forceRefresh: input.forceRefresh,
      demoMode: input.demoMode,
    });
  } catch (error) {
    if (error instanceof IssueFixActionError) {
      return {
        success: false,
        error: { code: error.code, message: error.message, status: error.status },
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
        message: error instanceof Error ? error.message : "Failed to generate fix plan.",
        status: 500,
      },
    };
  }

  const validation: ValidationResult = issueFixValidator.validate(plan);
  const preview = applyIssueFixPlan(fileContent, plan.steps);
  const previewDiff = buildPreviewDiff(targetFile, fileContent, preview.updatedContent);

  return {
    success: true,
    plan,
    preview,
    previewDiff,
    validation,
  };
}

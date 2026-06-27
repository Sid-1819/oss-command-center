"use server";

import { analyzeRepositoryDashboard } from "@/actions/analyzeRepositoryDashboard";
import { buildNextRecommendedActions } from "@/lib/action-run/next-recommended-actions";
import { AuthError, requireSession } from "@/lib/auth";
import { deleteBranch } from "@/lib/github/branches";
import { getPullRequestStatus } from "@/lib/github/pullRequestStatus";
import { createOctokit } from "@/lib/github";
import { GitHubServiceError } from "@/lib/github/errors";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type {
  ActionRun,
  ActionRunCompletion,
  RefreshActionRunStatusResult,
} from "@/types/action-run";
import { RequestError } from "octokit";

export async function refreshActionRunStatus(
  actionRun: ActionRun,
): Promise<RefreshActionRunStatusResult> {
  const parsed = parseRepositoryRef(actionRun.repositoryRef);

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

  const octokit = createOctokit(session.accessToken);

  let pullRequestStatus;

  try {
    pullRequestStatus = await getPullRequestStatus(octokit, {
      owner: parsed.owner,
      repo: parsed.repo,
      pullNumber: actionRun.pullRequestNumber,
    });
  } catch (error) {
    if (error instanceof RequestError) {
      return {
        success: false,
        error: {
          code: "GITHUB_FETCH",
          message: error.message || "Failed to fetch pull request status.",
          status: error.status ?? 500,
        },
      };
    }

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
        message: "Failed to fetch pull request status.",
        status: 500,
      },
    };
  }

  const now = new Date().toISOString();

  if (pullRequestStatus.state === "open") {
    return {
      success: true,
      actionRun: {
        ...actionRun,
        status: "AWAITING_REVIEW",
        updatedAt: now,
      },
    };
  }

  if (!pullRequestStatus.merged) {
    return {
      success: true,
      actionRun: {
        ...actionRun,
        status: "CLOSED",
        updatedAt: now,
      },
    };
  }

  const deleteResult = await deleteBranch({
    accessToken: session.accessToken,
    owner: parsed.owner,
    repo: parsed.repo,
    branch: actionRun.branch,
  });

  let issueClosed: boolean | undefined;
  let issueCloseWarning: string | undefined;

  if (
    actionRun.actionType === "issue-fix" &&
    actionRun.issueNumber &&
    pullRequestStatus.merged
  ) {
    const { closeIssue } = await import("@/lib/github/issues");
    const closeResult = await closeIssue({
      accessToken: session.accessToken,
      owner: parsed.owner,
      repo: parsed.repo,
      issueNumber: actionRun.issueNumber,
      comment: `Fixed in pull request #${actionRun.pullRequestNumber} (merged).`,
    });
    issueClosed = closeResult.success;
    issueCloseWarning = closeResult.warning;
  }

  const analysisResult = await analyzeRepositoryDashboard(parsed.repositoryRef);

  let completion: ActionRunCompletion = {
    mergedAt: pullRequestStatus.mergedAt,
    mergedBy: pullRequestStatus.mergedBy,
    branchDeleted: deleteResult.success,
    branchDeleteWarning: deleteResult.warning,
    issueClosed,
    issueCloseWarning,
    nextActions: [],
  };

  if (analysisResult.success) {
    completion = {
      ...completion,
      analysis: analysisResult.analysis,
      briefing: analysisResult.briefing,
      nextActions: buildNextRecommendedActions(analysisResult.briefing),
    };
  }

  return {
    success: true,
    actionRun: {
      ...actionRun,
      status: "COMPLETED",
      updatedAt: now,
      mergedAt: pullRequestStatus.mergedAt,
      mergedBy: pullRequestStatus.mergedBy,
      branchDeleted: deleteResult.success,
      branchDeleteWarning: deleteResult.warning,
      issueClosed,
      issueCloseWarning,
    },
    completion,
  };
}

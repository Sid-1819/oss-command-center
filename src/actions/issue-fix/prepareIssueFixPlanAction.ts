"use server";

import { IssueFixActionError } from "@/actions/issue-fix/types";
import { AuthError, requireSession } from "@/lib/auth";
import { getFileContents } from "@/lib/github/contents";
import { getIssue } from "@/lib/github/issues";
import { GitHubServiceError } from "@/lib/github/errors";
import { createOctokit } from "@/lib/github";
import { normalizeBriefing } from "@/lib/maintainer-briefing-utils";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type { PlanIssueFixActionInput } from "@/types/doc-plan-review";

export type PrepareIssueFixPlanResult =
  | {
      success: true;
      repositoryRef: string;
      issueNumber: number;
      issueTitle: string;
      issueBody?: string;
      candidate: NonNullable<
        ReturnType<typeof normalizeBriefing>["autoFixCandidates"][number]
      >;
      targetFile: string;
      analysis: PlanIssueFixActionInput["analysis"];
      currentContent: string;
      sourceSha: string;
      aiConfig?: PlanIssueFixActionInput["aiConfig"];
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        status?: number;
      };
    };

export async function prepareIssueFixPlanAction(
  input: PlanIssueFixActionInput,
): Promise<PrepareIssueFixPlanResult> {
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

  try {
    const session = await requireSession();
    const octokit = createOctokit(session.accessToken);

    const issueDetails = await getIssue(octokit, {
      owner: parsed.owner,
      repo: parsed.repo,
      issueNumber: input.issueNumber,
    });

    const file = await getFileContents({
      accessToken: session.accessToken,
      owner: parsed.owner,
      repo: parsed.repo,
      path: targetFile,
      ref: input.analysis.repository.defaultBranch,
    });

    return {
      success: true,
      repositoryRef: parsed.repositoryRef,
      issueNumber: input.issueNumber,
      issueTitle: issueDetails.title,
      issueBody: issueDetails.body ?? undefined,
      candidate,
      targetFile,
      analysis: input.analysis,
      currentContent: file.content,
      sourceSha: file.sha,
      aiConfig: input.aiConfig,
    };
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
        message: error instanceof Error ? error.message : "Failed to fetch issue or file.",
        status: 500,
      },
    };
  }
}

export { IssueFixActionError };

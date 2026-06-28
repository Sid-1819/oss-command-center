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

const DEMO_FILE_SHA = "demo-file-sha";
const DEMO_ISSUE_FIX_CONTENT = `# Contributing

## Development setup

Run \`npm instal example-project\` to install dependencies locally.
`;

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
    try {
      const session = await requireSession();
      const octokit = createOctokit(session.accessToken);

      const issueDetails = await getIssue(octokit, {
        owner: parsed.owner,
        repo: parsed.repo,
        issueNumber: input.issueNumber,
      });

      issueTitle = issueDetails.title;
      issueBody = issueDetails.body ?? undefined;

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

  return {
    success: true,
    repositoryRef: parsed.repositoryRef,
    issueNumber: input.issueNumber,
    issueTitle,
    issueBody,
    candidate,
    targetFile,
    analysis: input.analysis,
    currentContent: fileContent,
    sourceSha: fileSha,
    aiConfig: input.aiConfig ?? (input.demoMode ? { provider: "mock" } : undefined),
    demoMode: input.demoMode,
  };
}

export { IssueFixActionError };

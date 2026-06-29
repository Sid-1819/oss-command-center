"use server";

import type { ActionExecutionContext } from "@/actions/core/types";
import { issueFixExecutor } from "@/actions/issue-fix/executor";
import { issueFixReporter } from "@/actions/issue-fix/reporter";
import { IssueFixActionError } from "@/actions/issue-fix/types";
import { issueFixValidator } from "@/actions/issue-fix/validator";
import { buildIssueFixActionRun } from "@/lib/action-run/build-action-run";
import { AuthError, requireSession } from "@/lib/auth";
import { createOctokit, getRepository } from "@/lib/github";
import {
  hasRepositoryPushAccess,
  repositoryWriteAccessMessage,
} from "@/lib/github/permissions";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type {
  ExecuteIssueFixActionInput,
  ExecuteIssueFixActionResult,
} from "@/types/doc-plan-review";

export async function executeIssueFixAction(
  input: ExecuteIssueFixActionInput,
): Promise<ExecuteIssueFixActionResult> {
  const parsed = parseRepositoryRef(input.repositoryRef);

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION", message: parsed.message, status: 400 },
    };
  }

  const validation = issueFixValidator.validate(input.plan);

  if (!validation.valid) {
    const firstIssue = validation.issues[0];
    return {
      success: false,
      error: {
        code: "VALIDATION",
        message: firstIssue?.message ?? "Plan failed validation.",
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
        error: { code: "EXPIRED_SESSION", message: error.message, status: 401 },
      };
    }
    return {
      success: false,
      error: { code: "UNKNOWN", message: "Failed to verify session.", status: 500 },
    };
  }

  if (!session.user.username) {
    return {
      success: false,
      error: {
        code: "UNKNOWN",
        message: "GitHub username is missing from session.",
        status: 500,
      },
    };
  }

  const octokit = createOctokit(session.accessToken);

  let repository;

  try {
    repository = await getRepository(parsed.owner, parsed.repo, octokit);
  } catch (error) {
    return {
      success: false,
      error: {
        code: "GITHUB_FETCH",
        message: `Failed to fetch repository ${parsed.repositoryRef}`,
        status: 500,
      },
    };
  }

  if (!hasRepositoryPushAccess(repository.permissions)) {
    return {
      success: false,
      error: {
        code: "GITHUB_FETCH",
        message: repositoryWriteAccessMessage(parsed.repositoryRef),
        status: 403,
      },
    };
  }

  const context: ActionExecutionContext = {
    accessToken: session.accessToken,
    owner: parsed.owner,
    repo: parsed.repo,
    defaultBranch: repository.default_branch,
    user: { id: session.user.id, username: session.user.username },
    dryRun: false,
  };

  try {
    const output = await issueFixExecutor.execute(input.plan, context);
    const report = issueFixReporter.report(output);
    const actionRun = buildIssueFixActionRun(parsed.repositoryRef, input.plan, output);

    if (output.prUrl && output.prNumber) {
      const { commentOnIssue } = await import("@/lib/github/issues");
      await commentOnIssue({
        accessToken: session.accessToken,
        owner: parsed.owner,
        repo: parsed.repo,
        issueNumber: input.plan.issueNumber,
        body: `Opened pull request #${output.prNumber} to address this issue: ${output.prUrl}`,
      });
    }

    return {
      success: true,
      output,
      report,
      actionRun: actionRun ?? undefined,
    };
  } catch (error) {
    if (error instanceof IssueFixActionError) {
      return {
        success: false,
        error: { code: error.code, message: error.message, status: error.status },
      };
    }

    return {
      success: false,
      error: {
        code: "UNKNOWN",
        message: error instanceof Error ? error.message : "Failed to create pull request.",
        status: 500,
      },
    };
  }
}

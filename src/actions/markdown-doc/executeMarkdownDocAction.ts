"use server";

import type { ActionExecutionContext } from "@/actions/core/types";
import { markdownDocExecutor } from "@/actions/markdown-doc/executor";
import { markdownDocReporter } from "@/actions/markdown-doc/reporter";
import { MarkdownDocActionError } from "@/actions/markdown-doc/types";
import { markdownDocValidator } from "@/actions/markdown-doc/validator";
import { buildMarkdownDocActionRun } from "@/lib/action-run/build-action-run";
import {
  buildDemoActionRun,
  buildDemoMarkdownDocOutput,
} from "@/lib/demo/mock-execution";
import { AuthError, requireSession } from "@/lib/auth";
import { createOctokit, getRepository } from "@/lib/github";
import {
  hasRepositoryPushAccess,
  repositoryWriteAccessMessage,
} from "@/lib/github/permissions";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type {
  ExecuteMarkdownDocActionInput,
  ExecuteMarkdownDocActionResult,
} from "@/types/doc-plan-review";

export async function executeMarkdownDocAction(
  input: ExecuteMarkdownDocActionInput,
): Promise<ExecuteMarkdownDocActionResult> {
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

  const validation = markdownDocValidator.validate(input.plan);

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

  if (input.demoMode) {
    const { output, report } = buildDemoMarkdownDocOutput(
      parsed.repositoryRef,
      input.plan.targetFile,
    );
    const actionRun = buildDemoActionRun({
      repositoryRef: parsed.repositoryRef,
      actionType: "markdown-doc",
      planId: input.plan.planId,
      targetFile: input.plan.targetFile,
      pullRequestNumber: output.prNumber ?? 101,
      branch: output.branchName ?? "maintaineros/demo-doc",
    });

    return {
      success: true,
      output,
      report,
      actionRun,
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
    user: {
      id: session.user.id,
      username: session.user.username,
    },
    dryRun: false,
  };

  try {
    const output = await markdownDocExecutor.execute(input.plan, context);
    const report = markdownDocReporter.report(output);
    const actionRun = buildMarkdownDocActionRun(
      parsed.repositoryRef,
      input.plan,
      output,
    );

    return {
      success: true,
      output,
      report,
      actionRun: actionRun ?? undefined,
    };
  } catch (error) {
    if (error instanceof MarkdownDocActionError) {
      const code =
        error.code === "FILE_CHANGED" ? "README_CHANGED" : error.code;

      return {
        success: false,
        error: {
          code,
          message: error.message,
          status: error.status,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "UNKNOWN",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create pull request.",
        status: 500,
      },
    };
  }
}

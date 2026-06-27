"use server";

import type { ActionExecutionContext } from "@/actions/core/types";
import { readmeExecutor } from "@/actions/readme/executor";
import { readmeReporter } from "@/actions/readme/reporter";
import { ReadmeActionError } from "@/actions/readme/types";
import { readmeValidator } from "@/actions/readme/validator";
import { AuthError, requireSession } from "@/lib/auth";
import { createOctokit, getRepository } from "@/lib/github";
import { parseRepositoryRef } from "@/lib/parse-repository-ref";
import type {
  ExecuteReadmeActionInput,
  ExecuteReadmeActionResult,
} from "@/types/readme-plan-review";

export async function executeReadmeAction(
  input: ExecuteReadmeActionInput,
): Promise<ExecuteReadmeActionResult> {
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

  const validation = readmeValidator.validate(input.plan);

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
        code: "GITHUB_FETCH",
        message: `Failed to fetch repository ${parsed.repositoryRef}`,
        status: 500,
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
    const output = await readmeExecutor.execute(input.plan, context);
    const report = readmeReporter.report(output);

    return {
      success: true,
      output,
      report,
    };
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

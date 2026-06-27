import {
  createAction,
  runActionPipeline,
  type ActionExecutionContext,
} from "@/actions/core/Action";
import { getFileContents } from "@/lib/github/contents";
import { GitHubServiceError } from "@/lib/github/errors";
import { readmeExecutor } from "./executor";
import { readmePlanner } from "./planner";
import { readmeReporter } from "./reporter";
import {
  README_TARGET_FILE,
  ReadmeActionError,
  type ReadmeActionInput,
} from "./types";
import { readmeValidator } from "./validator";

export const readmeAction = createAction({
  metadata: {
    id: "readme",
    name: "Update README",
    description:
      "Plan and apply updates to README.md based on documentation drift.",
    version: "1.0.0",
    category: "documentation",
  },
  planner: readmePlanner,
  validator: readmeValidator,
  executor: readmeExecutor,
  reporter: readmeReporter,
});

export async function runReadmeAction(
  input: ReadmeActionInput,
  context: ActionExecutionContext,
) {
  let file;

  try {
    file = await getFileContents({
      accessToken: context.accessToken,
      owner: context.owner,
      repo: context.repo,
      path: README_TARGET_FILE,
      ref: context.defaultBranch,
    });
  } catch (error) {
    if (error instanceof GitHubServiceError) {
      throw new ReadmeActionError(error.message, "GITHUB_FETCH", error.status);
    }

    throw new ReadmeActionError(
      "Failed to fetch README.md",
      "GITHUB_FETCH",
      500,
    );
  }

  return runActionPipeline(
    readmeAction,
    {
      ...input,
      targetFile: README_TARGET_FILE,
      currentContent: file.content,
      sourceSha: file.sha,
    },
    context,
  );
}

export { DEFAULT_README_FIXTURE } from "./types";
export { executeReadmeAction } from "./executeReadmeAction";
export { planReadmeAction } from "./planReadmeAction";
export type {
  ReadmeActionInput,
  ReadmeActionReport,
  ReadmeExecutionOutput,
  ReadmeExecutionPlan,
  ReadmePlanStep,
} from "./types";

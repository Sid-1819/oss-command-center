import {
  clearActionRunAction,
  findActionRunForRepositoryAction,
  loadActionRunCompletionForRepositoryAction,
  saveActionRunAction,
} from "@/actions/workflow-state";
import { assertWorkflowResult } from "@/lib/workflow-state/errors";
import type { ActionRun, ActionRunCompletion } from "@/types/action-run";

export const ACTION_RUN_STORAGE_KEY = "maintaineros:action-run";

export async function saveActionRun(
  run: ActionRun,
  completion?: ActionRunCompletion,
): Promise<void> {
  assertWorkflowResult(await saveActionRunAction(run, completion));
}

export async function loadActionRunCompletion(
  repositoryRef?: string,
): Promise<ActionRunCompletion | null> {
  if (repositoryRef) {
    return assertWorkflowResult(
      await loadActionRunCompletionForRepositoryAction(repositoryRef),
    );
  }

  return null;
}

export async function loadActionRun(id: string, repositoryRef: string): Promise<ActionRun | null> {
  const run = await findActionRunForRepository(repositoryRef);

  if (!run || run.id !== id) {
    return null;
  }

  return run;
}

export async function clearActionRun(): Promise<void> {
  assertWorkflowResult(await clearActionRunAction());
}

export async function findActionRunForRepository(
  repositoryRef: string,
): Promise<ActionRun | null> {
  return assertWorkflowResult(await findActionRunForRepositoryAction(repositoryRef));
}

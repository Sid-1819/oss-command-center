import {
  loadDocPlanContextAction,
  loadIssuePlanContextAction,
  saveDocPlanContextAction,
  saveIssuePlanContextAction,
} from "@/actions/workflow-state";
import { assertWorkflowResult } from "@/lib/workflow-state/errors";
import type { DocPlanContext, IssuePlanContext } from "@/types/doc-plan-review";

export async function saveDocPlanContext(context: DocPlanContext): Promise<void> {
  assertWorkflowResult(await saveDocPlanContextAction(context));
}

export async function loadDocPlanContext(): Promise<DocPlanContext | null> {
  return assertWorkflowResult(await loadDocPlanContextAction());
}

export async function saveIssuePlanContext(context: IssuePlanContext): Promise<void> {
  assertWorkflowResult(await saveIssuePlanContextAction(context));
}

export async function loadIssuePlanContext(): Promise<IssuePlanContext | null> {
  return assertWorkflowResult(await loadIssuePlanContextAction());
}

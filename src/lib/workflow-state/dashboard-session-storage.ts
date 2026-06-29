import {
  loadDashboardSessionAction,
  saveDashboardSessionAction,
} from "@/actions/workflow-state";
import { assertWorkflowResult } from "@/lib/workflow-state/errors";
import type { DashboardSession } from "@/types/dashboard-analysis";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export async function saveDashboardSession(session: DashboardSession): Promise<void> {
  assertWorkflowResult(await saveDashboardSessionAction(session));
}

export async function loadDashboardSession(): Promise<DashboardSession | null> {
  return assertWorkflowResult(await loadDashboardSessionAction());
}

export async function syncDashboardSessionAfterMerge(input: {
  repositoryRef: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
}): Promise<void> {
  try {
    await saveDashboardSession({
      repositoryRef: input.repositoryRef,
      analysis: input.analysis,
      briefing: input.briefing,
      analyzedAt: new Date().toISOString(),
    });
  } catch {
    // Dashboard restore is best-effort and should not block merge completion.
  }
}

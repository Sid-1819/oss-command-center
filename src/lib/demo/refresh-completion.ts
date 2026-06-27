import { buildNextRecommendedActions } from "@/lib/action-run/next-recommended-actions";
import type { ActionRun, ActionRunCompletion } from "@/types/action-run";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export function buildDemoRefreshCompletion(input: {
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
}): ActionRunCompletion {
  const previousScore = input.briefing.repositoryHealth.score;
  const newScore = Math.min(100, previousScore + 3);
  const briefing: MaintainerBriefing = {
    ...input.briefing,
    repositoryHealth: {
      ...input.briefing.repositoryHealth,
      score: newScore,
    },
  };

  return {
    mergedAt: new Date().toISOString(),
    mergedBy: "demo-user",
    branchDeleted: true,
    nextActions: buildNextRecommendedActions(briefing),
    analysis: input.analysis,
    briefing,
  };
}

export function buildDemoCompletedActionRun(actionRun: ActionRun): ActionRun {
  const now = new Date().toISOString();

  return {
    ...actionRun,
    status: "COMPLETED",
    updatedAt: now,
    mergedAt: now,
    mergedBy: "demo-user",
    branchDeleted: true,
  };
}

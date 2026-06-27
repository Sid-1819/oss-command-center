import type { RecommendedAction } from "@/types/action-run";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";

export function buildNextRecommendedActions(
  briefing: MaintainerBriefing,
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  for (const [index, suggestion] of briefing.documentation.suggestions.entries()) {
    actions.push({
      id: `documentation-${index}`,
      category: "documentation",
      title: "Update README",
      reason: suggestion,
      executable: true,
      actionType: "readme",
      payload: { suggestion },
    });
  }

  for (const [index, priority] of briefing.priorities.entries()) {
    actions.push({
      id: `priority-${index}`,
      category: "priority",
      title: priority.title,
      reason: priority.reason,
      executable: false,
    });
  }

  if (briefing.release.reason.trim()) {
    actions.push({
      id: "release-readiness",
      category: "release",
      title: briefing.release.ready ? "Release ready" : "Release not ready",
      reason: briefing.release.reason,
      executable: false,
    });
  }

  for (const [index, opportunity] of briefing.contributorOpportunities.entries()) {
    actions.push({
      id: `contributor-${opportunity.issueNumber}-${index}`,
      category: "contributor",
      title: `Issue #${opportunity.issueNumber}`,
      reason: opportunity.reason,
      executable: false,
    });
  }

  for (const [index, recommendation] of briefing.recommendations.entries()) {
    actions.push({
      id: `recommendation-${index}`,
      category: "recommendation",
      title: "Recommendation",
      reason: recommendation,
      executable: false,
    });
  }

  return actions;
}

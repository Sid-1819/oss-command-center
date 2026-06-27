import { normalizeBriefing } from "@/lib/maintainer-briefing-utils";
import type { RecommendedAction } from "@/types/action-run";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";

export function buildNextRecommendedActions(
  briefing: MaintainerBriefing,
): RecommendedAction[] {
  const normalized = normalizeBriefing(briefing);
  const actions: RecommendedAction[] = [];

  for (const fileEntry of normalized.documentation.files) {
    for (const [index, suggestion] of fileEntry.suggestions.entries()) {
      actions.push({
        id: `documentation-${fileEntry.path}-${index}`,
        category: "documentation",
        title: `Update ${fileEntry.path}`,
        reason: suggestion,
        executable: true,
        actionType: "markdown-doc",
        payload: { suggestion, targetFile: fileEntry.path },
      });
    }
  }

  for (const [index, candidate] of normalized.autoFixCandidates.entries()) {
    actions.push({
      id: `auto-fix-${candidate.issueNumber}-${index}`,
      category: "auto-fix",
      title: `Fix issue #${candidate.issueNumber}`,
      reason: candidate.reason,
      executable: true,
      actionType: "issue-fix",
      payload: { issueNumber: candidate.issueNumber },
    });
  }

  for (const [index, priority] of normalized.priorities.entries()) {
    actions.push({
      id: `priority-${index}`,
      category: "priority",
      title: priority.title,
      reason: priority.reason,
      executable: false,
    });
  }

  if (normalized.release.reason.trim()) {
    actions.push({
      id: "release-readiness",
      category: "release",
      title: normalized.release.ready ? "Release ready" : "Release not ready",
      reason: normalized.release.reason,
      executable: false,
    });
  }

  for (const [index, opportunity] of normalized.contributorOpportunities.entries()) {
    actions.push({
      id: `contributor-${opportunity.issueNumber}-${index}`,
      category: "contributor",
      title: `Issue #${opportunity.issueNumber}`,
      reason: opportunity.reason,
      executable: false,
    });
  }

  for (const [index, recommendation] of normalized.recommendations.entries()) {
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

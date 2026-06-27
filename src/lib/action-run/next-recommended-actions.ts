import { normalizeBriefing } from "@/lib/maintainer-briefing-utils";
import type { RecommendedAction } from "@/types/action-run";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";

export const TOP_RECOMMENDED_ACTIONS_LIMIT = 3;

const PRIORITY_WEIGHT: Record<"high" | "medium" | "low", number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const CATEGORY_WEIGHT: Record<RecommendedAction["category"], number> = {
  "auto-fix": 0,
  documentation: 1,
  priority: 2,
  release: 3,
  contributor: 4,
  recommendation: 5,
};

function prioritySortKey(action: RecommendedAction): number {
  return CATEGORY_WEIGHT[action.category];
}

export function rankRecommendedActions(actions: RecommendedAction[]): RecommendedAction[] {
  return [...actions].sort((left, right) => {
    const leftExecutable = left.executable ? 0 : 1;
    const rightExecutable = right.executable ? 0 : 1;

    if (leftExecutable !== rightExecutable) {
      return leftExecutable - rightExecutable;
    }

    const leftCategory = prioritySortKey(left);
    const rightCategory = prioritySortKey(right);

    if (leftCategory !== rightCategory) {
      return leftCategory - rightCategory;
    }

    return left.title.localeCompare(right.title);
  });
}

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

  for (const [index, priority] of [...normalized.priorities]
    .sort((left, right) => PRIORITY_WEIGHT[left.priority] - PRIORITY_WEIGHT[right.priority])
    .entries()) {
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

  return rankRecommendedActions(actions);
}

export function getTopRecommendedActions(
  briefing: MaintainerBriefing,
): RecommendedAction[] {
  return buildNextRecommendedActions(briefing).slice(0, TOP_RECOMMENDED_ACTIONS_LIMIT);
}

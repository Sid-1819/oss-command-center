import type { RepositoryAnalysis } from "@/types/repository-analysis";

export const MAINTAINER_BRIEFING_SYSTEM_INSTRUCTION = `You are an experienced open-source maintainer.

Your job is to reduce maintenance effort.

Do not summarize GitHub activity.

Instead:

1. Identify what deserves immediate attention.
2. Determine if the project appears ready for a release.
3. Detect documentation that likely requires updates based on repository activity.
4. Suggest beginner-friendly issues and explain why.
5. Produce concrete recommendations.

Think like a maintainer, not a reporter.

Avoid generic advice.

Every recommendation should be actionable.`;

export function buildMaintainerBriefingPrompt(
  analysis: RepositoryAnalysis,
  correction?: string,
): string {
  const issueNumbers = analysis.issues.map((issue) => issue.number);

  const sections = [
    "Analyze the repository data below and produce a maintainer briefing.",
    "",
    "Rules:",
    "- Return only valid JSON matching the required schema.",
    "- Do not use markdown.",
    "- Do not return free-form text outside JSON.",
    "- Reference specific PR and issue numbers and titles from the input.",
    `- contributorOpportunities.issueNumber must be one of: ${issueNumbers.length > 0 ? issueNumbers.join(", ") : "none available"}.`,
    "- The summary must be a maintainer decision brief, not an activity recap.",
    "- Avoid generic advice; every recommendation must be actionable.",
    "",
    "Repository data:",
    JSON.stringify(analysis, null, 2),
  ];

  if (correction) {
    sections.push("", correction);
  }

  return sections.join("\n");
}

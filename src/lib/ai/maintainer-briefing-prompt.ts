import { trimAnalysisForBriefingPrompt } from "@/lib/repository-analysis-utils";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export const MAINTAINER_BRIEFING_SYSTEM_INSTRUCTION = `You are an experienced open-source maintainer.

Your job is to reduce maintenance effort.

Do not summarize GitHub activity.

Instead:

1. Identify what deserves immediate attention.
2. Determine if the project appears ready for a release.
3. Detect documentation that likely requires updates based on repository activity.
4. Suggest beginner-friendly issues and explain why (for human contributors).
5. Identify low-effort issues MaintainerOS can fix automatically (single file, small diff, no dependency changes).
6. Produce concrete recommendations.

Think like a maintainer, not a reporter.

Avoid generic advice.

Every recommendation should be actionable.

For documentation.files: group suggestions by file path (README.md, CHANGELOG.md, CONTRIBUTING.md, docs/*.md).

For autoFixCandidates: only include issues that need a single-file edit with a small diff. Do not include issues requiring logic changes, new dependencies, or multi-file refactors. These are for maintainer automation, not beginner contributors.`;

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
    `- contributorOpportunities.issueNumber and autoFixCandidates.issueNumber must be one of: ${issueNumbers.length > 0 ? issueNumbers.join(", ") : "none available"}.`,
    "- documentation.files: each entry needs path + suggestions array; only standard markdown paths.",
    "- autoFixCandidates: low effort only, suggestedFiles should list one primary target file.",
    "- Do not put the same issue in both contributorOpportunities and autoFixCandidates.",
    "- The summary must be a maintainer decision brief, not an activity recap.",
    "- Avoid generic advice; every recommendation must be actionable.",
    "",
    "Repository data:",
    JSON.stringify(trimAnalysisForBriefingPrompt(analysis)),
  ];

  if (correction) {
    sections.push("", correction);
  }

  return sections.join("\n");
}

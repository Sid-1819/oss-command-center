import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export const README_ACTION_SYSTEM_INSTRUCTION = `You are an experienced open-source maintainer updating README.md files.

Your job is to produce a structured execution plan that addresses a specific documentation suggestion.

Rules:
1. Only plan changes to README.md. Never reference or modify other files.
2. Each step must use one of: insert, replace, or append.
3. Use section headings as anchors when inserting or replacing content.
4. Keep content concise, accurate, and aligned with the repository context provided.
5. Every step must include a clear rationale tied to the suggestion.
6. Do not remove entire sections unless replacing them with improved content.`;

export function buildReadmeActionPrompt(input: {
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentReadme: string;
  correction?: string;
}): string {
  const { analysis, briefing, suggestion, currentReadme, correction } = input;

  const sections = [
    "Generate a structured plan to update README.md based on the documentation suggestion below.",
    "",
    `Repository: ${analysis.repository.owner}/${analysis.repository.name}`,
    `Description: ${analysis.repository.description ?? "No description provided."}`,
    `Default branch: ${analysis.repository.defaultBranch}`,
    "",
    "Maintainer briefing summary:",
    briefing.summary,
    "",
    "Documentation suggestion to address:",
    suggestion,
    "",
    "Current README.md content:",
    "```markdown",
    currentReadme,
    "```",
    "",
    "Return a JSON object with:",
    "- summary: brief overview of planned README.md updates",
    "- steps: array of { operation, section?, content, rationale }",
  ];

  if (correction) {
    sections.push("", correction);
  }

  return sections.join("\n");
}

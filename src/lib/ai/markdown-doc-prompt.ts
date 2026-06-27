import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

function fileGuidance(targetFile: string): string {
  const lower = targetFile.toLowerCase();

  if (lower === "changelog.md") {
    return "Focus on release entries, version headers, and dated change lists.";
  }

  if (lower === "contributing.md") {
    return "Focus on contribution guidelines, PR process, and code standards.";
  }

  if (lower.startsWith("docs/")) {
    return "Focus on accurate technical documentation for the referenced topic.";
  }

  return "Focus on project overview, installation, usage, and key sections.";
}

export function buildMarkdownDocSystemInstruction(targetFile: string): string {
  return `You are an experienced open-source maintainer updating ${targetFile}.

Your job is to produce a structured execution plan that addresses a specific documentation suggestion.

Rules:
1. Only plan changes to ${targetFile}. Never reference or modify other files.
2. Each step must use one of: insert, replace, or append.
3. Use section headings as anchors when inserting or replacing content.
4. ${fileGuidance(targetFile)}
5. Keep content concise, accurate, and aligned with the repository context provided.
6. Every step must include a clear rationale tied to the suggestion.
7. Do not remove entire sections unless replacing them with improved content.`;
}

export function buildMarkdownDocActionPrompt(input: {
  targetFile: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentContent: string;
  correction?: string;
}): string {
  const { targetFile, analysis, briefing, suggestion, currentContent, correction } =
    input;

  const sections = [
    `Generate a structured plan to update ${targetFile} based on the documentation suggestion below.`,
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
    `Current ${targetFile} content:`,
    "```markdown",
    currentContent,
    "```",
    "",
    "Return a JSON object with:",
    `- summary: brief overview of planned ${targetFile} updates`,
    "- steps: array of { operation, section?, content, rationale }",
  ];

  if (correction) {
    sections.push("", correction);
  }

  return sections.join("\n");
}

export const README_ACTION_SYSTEM_INSTRUCTION =
  buildMarkdownDocSystemInstruction("README.md");

export function buildReadmeActionPrompt(input: {
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentReadme: string;
  correction?: string;
}): string {
  return buildMarkdownDocActionPrompt({
    targetFile: "README.md",
    analysis: input.analysis,
    briefing: input.briefing,
    suggestion: input.suggestion,
    currentContent: input.currentReadme,
    correction: input.correction,
  });
}

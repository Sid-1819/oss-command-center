import type { RepositoryAnalysis } from "@/types/repository-analysis";
import type { AutoFixCandidate } from "@/types/maintainer-briefing";

export const ISSUE_FIX_SYSTEM_INSTRUCTION = `You are an experienced open-source maintainer fixing a low-effort GitHub issue.

Rules:
1. Only modify ONE target file provided in the prompt.
2. Produce a minimal fix: small diff, no new dependencies, no multi-file changes.
3. Steps may use insert, replace, append (for markdown with headings), or replace_all (for small non-markdown or full-file replacements).
4. Do not modify package.json, lock files, or add dependencies.
5. Every step needs a clear rationale tied to the issue.
6. Keep changes under ~50 lines total.`;

export function buildIssueFixActionPrompt(input: {
  issueNumber: number;
  issueTitle: string;
  issueBody?: string;
  candidate: AutoFixCandidate;
  targetFile: string;
  analysis: RepositoryAnalysis;
  currentContent: string;
  correction?: string;
}): string {
  const sections = [
    `Generate a structured plan to fix issue #${input.issueNumber}: ${input.issueTitle}`,
    "",
    `Repository: ${input.analysis.repository.owner}/${input.analysis.repository.name}`,
    `Fix type: ${input.candidate.fixType}`,
    `Reason: ${input.candidate.reason}`,
    `Target file: ${input.targetFile}`,
    "",
    "Issue body:",
    input.issueBody?.trim() || "(no body provided)",
    "",
    `Current ${input.targetFile} content:`,
    "```",
    input.currentContent,
    "```",
    "",
    "Return JSON with summary and steps array.",
  ];

  if (input.correction) {
    sections.push("", input.correction);
  }

  return sections.join("\n");
}

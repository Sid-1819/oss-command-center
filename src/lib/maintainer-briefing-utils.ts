import type {
  DocumentationFileSuggestion,
  MaintainerBriefing,
} from "@/types/maintainer-briefing";

interface LegacyDocumentation {
  outdated: boolean;
  suggestions?: string[];
  files?: DocumentationFileSuggestion[];
}

export function normalizeDocumentationFiles(
  documentation: LegacyDocumentation,
): DocumentationFileSuggestion[] {
  if (documentation.files && documentation.files.length > 0) {
    return documentation.files;
  }

  const legacySuggestions = documentation.suggestions ?? [];

  if (legacySuggestions.length === 0) {
    return [];
  }

  return [{ path: "README.md", suggestions: legacySuggestions }];
}

export function normalizeBriefing(briefing: MaintainerBriefing): MaintainerBriefing {
  const raw = briefing as MaintainerBriefing & {
    documentation: LegacyDocumentation;
  };

  return {
    ...briefing,
    documentation: {
      outdated: raw.documentation.outdated,
      files: normalizeDocumentationFiles(raw.documentation),
    },
    autoFixCandidates: briefing.autoFixCandidates ?? [],
  };
}

export function getAllDocumentationSuggestions(
  briefing: MaintainerBriefing,
): Array<{ path: string; suggestion: string }> {
  const normalized = normalizeBriefing(briefing);
  const items: Array<{ path: string; suggestion: string }> = [];

  for (const file of normalized.documentation.files) {
    for (const suggestion of file.suggestions) {
      items.push({ path: file.path, suggestion });
    }
  }

  return items;
}

export function countAiAutomatableTasks(briefing: MaintainerBriefing): number {
  const normalized = normalizeBriefing(briefing);
  const docTasks = normalized.documentation.files.reduce(
    (count, file) => count + file.suggestions.length,
    0,
  );

  return normalized.autoFixCandidates.length + docTasks;
}

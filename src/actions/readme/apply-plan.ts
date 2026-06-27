import type { ReadmePlanStep } from "./types";

interface SectionRange {
  start: number;
  end: number;
  headingLevel: number;
}

function findSectionRange(content: string, section: string): SectionRange | null {
  const lines = content.split("\n");
  const normalizedSection = section.trim().toLowerCase();
  let startLine = -1;
  let headingLevel = 0;

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index]?.match(/^(#{1,6})\s+(.+)$/);

    if (!match) {
      continue;
    }

    const heading = match[2]?.trim().toLowerCase();

    if (heading === normalizedSection) {
      startLine = index;
      headingLevel = match[1]?.length ?? 1;
      break;
    }
  }

  if (startLine === -1) {
    return null;
  }

  let endLine = lines.length;

  for (let index = startLine + 1; index < lines.length; index++) {
    const match = lines[index]?.match(/^(#{1,6})\s+/);

    if (match && (match[1]?.length ?? 6) <= headingLevel) {
      endLine = index;
      break;
    }
  }

  const start = lines.slice(0, startLine).join("\n").length;
  const end = lines.slice(0, endLine).join("\n").length;

  return { start, end, headingLevel };
}

function appendContent(content: string, stepContent: string): string {
  return content.endsWith("\n")
    ? `${content}${stepContent}`
    : `${content}\n${stepContent}`;
}

function applyStep(content: string, step: ReadmePlanStep): string {
  switch (step.operation) {
    case "append":
      return appendContent(content, step.content);

    case "insert": {
      if (!step.section) {
        return appendContent(content, step.content);
      }

      const insertRange = findSectionRange(content, step.section);

      if (!insertRange) {
        return appendContent(content, step.content);
      }

      const before = content.slice(0, insertRange.end);
      const after = content.slice(insertRange.end);
      const insertion = before.endsWith("\n")
        ? `\n${step.content}`
        : `\n\n${step.content}`;

      return `${before}${insertion}${after}`;
    }

    case "replace": {
      if (!step.section) {
        return appendContent(content, step.content);
      }

      const replaceRange = findSectionRange(content, step.section);

      if (!replaceRange) {
        return appendContent(content, step.content);
      }

      const before = content.slice(0, replaceRange.start);
      const after = content.slice(replaceRange.end);
      const headingPrefix = "#".repeat(replaceRange.headingLevel);
      const heading = `${headingPrefix} ${step.section}`;
      const replacement = `${heading}\n\n${step.content.trim()}`;

      if (before.endsWith("\n") || before.length === 0) {
        return `${before}${replacement}${after.startsWith("\n") ? after : `\n${after}`}`;
      }

      return `${before}\n${replacement}${after.startsWith("\n") ? after : `\n${after}`}`;
    }
  }
}

export interface ApplyReadmePlanResult {
  updatedContent: string;
  appliedSteps: ReadmePlanStep[];
  skippedSteps: ReadmePlanStep[];
}

export function applyReadmePlan(
  content: string,
  steps: ReadmePlanStep[],
): ApplyReadmePlanResult {
  let updatedContent = content;
  const appliedSteps: ReadmePlanStep[] = [];
  const skippedSteps: ReadmePlanStep[] = [];

  for (const step of steps) {
    const nextContent = applyStep(updatedContent, step);

    if (nextContent === updatedContent && step.operation !== "append") {
      skippedSteps.push(step);
      continue;
    }

    updatedContent = nextContent;
    appliedSteps.push(step);
  }

  return {
    updatedContent,
    appliedSteps,
    skippedSteps,
  };
}

export function buildPreviewDiff(
  fileName: string,
  originalContent: string,
  updatedContent: string,
): string {
  const originalLines = originalContent.split("\n");
  const updatedLines = updatedContent.split("\n");
  const diffLines = [`--- a/${fileName}`, `+++ b/${fileName}`];

  const maxLines = Math.max(originalLines.length, updatedLines.length);

  for (let index = 0; index < maxLines; index++) {
    const originalLine = originalLines[index];
    const updatedLine = updatedLines[index];

    if (originalLine === updatedLine) {
      if (originalLine !== undefined) {
        diffLines.push(` ${originalLine}`);
      }
      continue;
    }

    if (originalLine !== undefined) {
      diffLines.push(`-${originalLine}`);
    }

    if (updatedLine !== undefined) {
      diffLines.push(`+${updatedLine}`);
    }
  }

  return diffLines.join("\n");
}

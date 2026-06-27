import type { RepositoryAnalysis } from "@/types/repository-analysis";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import repositoryAnalysisFixture from "@/lib/ai/fixtures/repository-analysis.json";
import maintainerBriefingFixture from "@/lib/ai/fixtures/maintainer-briefing.json";
import { normalizeBriefing } from "@/lib/maintainer-briefing-utils";
import type { ActionRun } from "@/types/action-run";
import type {
  MarkdownDocActionReport,
  MarkdownDocExecutionOutput,
} from "@/actions/markdown-doc/types";
import type {
  IssueFixActionReport,
  IssueFixExecutionOutput,
} from "@/actions/issue-fix/types";

export const DEMO_REPOSITORY_REF = "demo/example-project";

export function getDemoRepositoryAnalysis(): RepositoryAnalysis {
  return repositoryAnalysisFixture as RepositoryAnalysis;
}

export function getDemoMaintainerBriefing(): MaintainerBriefing {
  return normalizeBriefing(maintainerBriefingFixture as MaintainerBriefing);
}

export function buildDemoMarkdownDocOutput(
  repositoryRef: string,
  targetFile: string,
): { output: MarkdownDocExecutionOutput; report: MarkdownDocActionReport } {
  const pullRequestNumber = 101;
  const branchName = `maintaineros/demo-doc-${Date.now()}`;
  const previewDiff = `--- a/${targetFile}\n+++ b/${targetFile}\n`;

  return {
    output: {
      branchName,
      commitSha: "demo-commit-sha",
      prNumber: pullRequestNumber,
      prUrl: `https://github.com/${repositoryRef}/pull/${pullRequestNumber}`,
      filesChanged: [targetFile],
      executionDurationMs: 250,
      dryRun: true,
      targetFile,
      originalContent: "# Demo\n",
      updatedContent: "# Demo\n\n## Environment Variables\n\n| Variable | Description |\n",
      appliedSteps: [],
      skippedSteps: [],
      previewDiff,
    },
    report: {
      status: "completed",
      summary: `Demo PR opened for ${targetFile} (no GitHub writes).`,
      highlights: [`Updated ${targetFile} with fixture changes.`],
      warnings: ["Demo mode — no real pull request was created."],
      previewDiff,
      changedSections: ["Environment Variables"],
    },
  };
}

export function buildDemoIssueFixOutput(
  repositoryRef: string,
  issueNumber: number,
  targetFile: string,
): { output: IssueFixExecutionOutput; report: IssueFixActionReport } {
  const pullRequestNumber = 102;
  const branchName = `maintaineros/demo-issue-${issueNumber}`;
  const previewDiff = `--- a/${targetFile}\n+++ b/${targetFile}\n`;

  return {
    output: {
      branchName,
      commitSha: "demo-commit-sha",
      prNumber: pullRequestNumber,
      prUrl: `https://github.com/${repositoryRef}/pull/${pullRequestNumber}`,
      filesChanged: [targetFile],
      executionDurationMs: 250,
      dryRun: true,
      issueNumber,
      targetFile,
      originalContent: "# Contributing\n",
      updatedContent: "# Contributing\n\nnpm install example-project\n",
      appliedSteps: [],
      skippedSteps: [],
      previewDiff,
    },
    report: {
      status: "completed",
      summary: `Demo fix PR for issue #${issueNumber} (no GitHub writes).`,
      highlights: [`Prepared fix for ${targetFile}.`],
      warnings: ["Demo mode — no real pull request was created."],
      previewDiff,
    },
  };
}

export function buildDemoActionRun(params: {
  repositoryRef: string;
  actionType: ActionRun["actionType"];
  planId: string;
  targetFile?: string;
  issueNumber?: number;
  pullRequestNumber: number;
  branch: string;
}): ActionRun {
  const now = new Date().toISOString();

  return {
    id: `run-${params.planId}`,
    actionId: params.planId,
    actionType: params.actionType,
    repositoryRef: params.repositoryRef,
    targetFile: params.targetFile,
    issueNumber: params.issueNumber,
    branch: params.branch,
    pullRequestNumber: params.pullRequestNumber,
    pullRequestUrl: `https://github.com/${params.repositoryRef}/pull/${params.pullRequestNumber}`,
    status: "AWAITING_REVIEW",
    createdAt: now,
    updatedAt: now,
  };
}

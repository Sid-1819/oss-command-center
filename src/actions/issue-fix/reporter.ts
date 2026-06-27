import type { Reporter } from "@/actions/core/Reporter";
import type { IssueFixActionReport, IssueFixExecutionOutput } from "./types";

export const issueFixReporter: Reporter<IssueFixExecutionOutput, IssueFixActionReport> = {
  report(output) {
    const highlights = output.appliedSteps.map(
      (step) => step.rationale || `Applied ${step.operation} to ${output.targetFile}`,
    );

    if (output.prUrl) {
      highlights.unshift(`Pull request opened: ${output.prUrl}`);
    }

    const warnings: string[] = [];

    if (output.skippedSteps.length > 0) {
      warnings.push(`${output.skippedSteps.length} step(s) skipped during apply.`);
    }

    const summary = output.prNumber
      ? `Opened pull request #${output.prNumber} to fix issue #${output.issueNumber}.`
      : `Prepared fix for issue #${output.issueNumber}.`;

    return {
      status: output.appliedSteps.length > 0 ? "completed" : "failed",
      summary,
      highlights,
      warnings,
      previewDiff: output.previewDiff,
    };
  },
};

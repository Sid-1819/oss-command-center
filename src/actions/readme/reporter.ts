import type { Reporter } from "@/actions/core/Reporter";
import type { ReadmeActionReport, ReadmeExecutionOutput } from "./types";

export const readmeReporter: Reporter<ReadmeExecutionOutput, ReadmeActionReport> = {
  report(output) {
    const changedSections = [
      ...new Set(
        output.appliedSteps
          .map((step) => step.section)
          .filter((section): section is string => Boolean(section)),
      ),
    ];

    const highlights = output.appliedSteps.map(
      (step) => step.rationale || `Applied ${step.operation} to README.md`,
    );

    if (output.prUrl) {
      highlights.unshift(`Pull request opened: ${output.prUrl}`);
    }

    const warnings: string[] = [];

    if (output.dryRun) {
      warnings.push("Dry run — no GitHub changes were made.");
    }

    if (output.skippedSteps.length > 0) {
      warnings.push(
        `${output.skippedSteps.length} planned step(s) could not be applied and were skipped.`,
      );
    }

    const status =
      output.appliedSteps.length === 0
        ? "failed"
        : output.skippedSteps.length > 0
          ? "partial"
          : "completed";

    const summary = output.dryRun
      ? `Dry run completed for README.md with ${output.appliedSteps.length} change(s).`
      : output.prNumber
        ? `Opened pull request #${output.prNumber} to update README.md.`
        : status === "partial"
          ? `Partially applied README.md update (${output.appliedSteps.length} of ${output.appliedSteps.length + output.skippedSteps.length} steps).`
          : `Updated README.md with ${output.appliedSteps.length} change(s).`;

    return {
      status,
      summary,
      highlights,
      warnings,
      previewDiff: output.previewDiff,
      changedSections,
    };
  },
};

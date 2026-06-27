import type { ReadmeActionReport, ReadmeExecutionOutput } from "@/actions/readme/types";
import type { ExecutionResult, PreflightCheck } from "@/types/execution-workflow";

export function toExecutionResult(
  output: ReadmeExecutionOutput,
  report: ReadmeActionReport,
  preflightChecks: PreflightCheck[],
): ExecutionResult {
  const checksPassedCount = preflightChecks.filter(
    (check) => check.status === "success",
  ).length;
  const checksFailedCount = preflightChecks.filter(
    (check) => check.status === "error",
  ).length;

  const logs = [...report.highlights, ...report.warnings];
  const isSuccess = Boolean(output.prUrl);

  return {
    status: isSuccess ? "success" : "failed",
    summary: report.summary,
    logs,
    changesApplied: output.appliedSteps.length,
    checksPassedCount,
    checksFailedCount,
    prUrl: output.prUrl ?? undefined,
    branchName: output.branchName ?? undefined,
    canRollback: false,
  };
}

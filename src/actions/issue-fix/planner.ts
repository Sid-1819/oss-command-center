import type { Planner } from "@/actions/core/Planner";
import { generateIssueFixPlanFromContext } from "@/lib/ai/generate-issue-fix-plan";
import {
  IssueFixActionError,
  type IssueFixActionInput,
  type IssueFixExecutionPlan,
} from "./types";

function createPlanId(issueNumber: number): string {
  return `issue-${issueNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const issueFixPlanner: Planner<IssueFixActionInput, IssueFixExecutionPlan> = {
  async plan(input) {
    if (!input.currentContent?.trim()) {
      throw new IssueFixActionError("File content is required", "VALIDATION", 400);
    }

    if (!input.sourceSha?.trim()) {
      throw new IssueFixActionError("Source SHA is required", "VALIDATION", 400);
    }

    const payload = await generateIssueFixPlanFromContext({
      issueNumber: input.issueNumber,
      issueTitle: input.issueTitle,
      issueBody: input.issueBody,
      candidate: input.candidate,
      targetFile: input.targetFile,
      analysis: input.analysis,
      currentContent: input.currentContent,
      aiConfig: input.aiConfig,
      forceRefresh: input.forceRefresh,
    });

    return {
      planId: createPlanId(input.issueNumber),
      actionId: "issue-fix",
      summary: payload.summary,
      steps: payload.steps,
      createdAt: new Date().toISOString(),
      issueNumber: input.issueNumber,
      targetFile: input.targetFile,
      currentContent: input.currentContent,
      sourceSha: input.sourceSha,
    };
  },
};

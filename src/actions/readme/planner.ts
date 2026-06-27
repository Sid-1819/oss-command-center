import type { Planner } from "@/actions/core/Planner";
import { generateReadmePlanFromContext } from "@/lib/ai/generate-readme-plan";
import {
  README_TARGET_FILE,
  ReadmeActionError,
  type ReadmeActionInput,
  type ReadmeExecutionPlan,
} from "./types";

function createPlanId(): string {
  return `readme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const readmePlanner: Planner<ReadmeActionInput, ReadmeExecutionPlan> = {
  async plan(input) {
    if (!input.currentReadme?.trim()) {
      throw new ReadmeActionError(
        "README content is required before planning",
        "VALIDATION",
        400,
      );
    }

    if (!input.sourceSha?.trim()) {
      throw new ReadmeActionError(
        "README source SHA is required before planning",
        "VALIDATION",
        400,
      );
    }

    const payload = await generateReadmePlanFromContext({
      analysis: input.analysis,
      briefing: input.briefing,
      suggestion: input.suggestion,
      currentReadme: input.currentReadme,
    });

    return {
      planId: createPlanId(),
      actionId: "readme",
      summary: payload.summary,
      steps: payload.steps,
      createdAt: new Date().toISOString(),
      targetFile: README_TARGET_FILE,
      currentReadme: input.currentReadme,
      sourceSha: input.sourceSha,
    };
  },
};

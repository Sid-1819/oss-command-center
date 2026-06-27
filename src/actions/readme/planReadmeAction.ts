"use server";

import { planMarkdownDocAction } from "@/actions/markdown-doc/planMarkdownDocAction";
import { README_TARGET_FILE } from "@/actions/markdown-doc/types";
import type {
  PlanReadmeActionInput,
  PlanReadmeActionResult,
} from "@/types/doc-plan-review";

export async function planReadmeAction(
  input: PlanReadmeActionInput,
): Promise<PlanReadmeActionResult> {
  return planMarkdownDocAction({
    ...input,
    targetFile: README_TARGET_FILE,
  });
}

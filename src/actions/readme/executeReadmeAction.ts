"use server";

import { executeMarkdownDocAction } from "@/actions/markdown-doc/executeMarkdownDocAction";
import type {
  ExecuteReadmeActionInput,
  ExecuteReadmeActionResult,
} from "@/types/doc-plan-review";

export async function executeReadmeAction(
  input: ExecuteReadmeActionInput,
): Promise<ExecuteReadmeActionResult> {
  return executeMarkdownDocAction(input);
}

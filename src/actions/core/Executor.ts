import type { ActionExecutionContext } from "./types";

export interface Executor<TPlan, TOutput> {
  execute(plan: TPlan, context: ActionExecutionContext): Promise<TOutput>;
}
